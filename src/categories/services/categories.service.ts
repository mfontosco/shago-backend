import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Categeories } from '../entities/categories.entities';
import { Product } from '../../products/entities/product.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoriesDto,
} from '../dtos/create-category.dto';
import { AuditLoggerService } from '../../audit-logs/services/audit-logger.service';

/**
 * Categories Service
 *
 * Handles category management:
 * - Create categories
 * - List/search categories
 * - Update categories
 * - Delete categories
 * - Get category statistics
 *
 * Multi-tenancy: All methods filter by tenant_id
 * Categories are isolated per vendor
 *
 * Used by:
 * - CategoriesController (vendor endpoints at /api/v1/vendor/categories)
 * - ProductsService (category validation)
 * - Dashboard (category stats)
 */
@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Categeories)
    private categoriesRepository: Repository<Categeories>,

    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    private auditLogger: AuditLoggerService,
  ) {}

  /**
   * Create a new category for a specific tenant
   */
  async create(dto: CreateCategoryDto, tenantId: string, adminId?: string): Promise<Categeories> {
    // Check name is unique per tenant
    const existing = await this.categoriesRepository.findOne({
      where: { name: dto.name, tenant_id: tenantId },  // ← Unique per tenant
    });

    if (existing) {
      throw new BadRequestException('Category name already exists');
    }

    const category = this.categoriesRepository.create({
      tenant_id: tenantId,  // ← CRITICAL: Set vendor ownership
      name: dto.name,
      description: dto.description,
      image_url: dto.image_url,
    });

    const saved = await this.categoriesRepository.save(category);

    // Audit log
    if (adminId) {
      await this.auditLogger.log({
        userId: adminId,
        resource: 'categories',
        action: 'create',
        entityId: saved.id,
        description: `Category created: ${dto.name}`,
      });
    }

    return saved;
  }

  /**
   * Find all categories for a specific tenant with pagination and filtering
   */
  async findAll(query: QueryCategoriesDto, tenantId: string): Promise<{ data: Categeories[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    let queryBuilder = this.categoriesRepository.createQueryBuilder('category')
      .where('category.tenant_id = :tenantId', { tenantId });  // ← CRITICAL: Filter by tenant

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.andWhere(
        'category.name ILIKE :search OR category.description ILIKE :search',
        { search: `%${query.search}%` },
      );
    }

    // Apply sorting
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'DESC';
    queryBuilder = queryBuilder.orderBy(`category.${sortBy}`, sortOrder as any);

    // Get total
    const total = await queryBuilder.getCount();

    // Get paginated data with product count
    const data = await queryBuilder
      .loadAllRelationIds({
        relations: ['products'],
        disableMixedMap: true,
      })
      .skip(skip)
      .take(limit)
      .getMany();

    // Add product count to each category
    for (const category of data) {
      const productCount = await this.productsRepository.count({
        where: { category_id: category.id },
      });
      (category as any).product_count = productCount;
    }

    return { data, total };
  }

  /**
   * Find single category by ID - verify tenant ownership
   */
  async findOne(id: string, tenantId: string): Promise<Categeories> {
    const category = await this.categoriesRepository.findOne({
      where: { id, tenant_id: tenantId },  // ← CRITICAL: Verify ownership
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Add product count
    const productCount = await this.productsRepository.count({
      where: { category_id: id, tenant_id: tenantId },  // ← Filter by tenant
    });
    (category as any).product_count = productCount;

    return category;
  }

  /**
   * Update category for a specific tenant
   */
  async update(id: string, dto: UpdateCategoryDto, tenantId: string, adminId: string): Promise<Categeories> {
    const category = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    const changes: any[] = [];

    if (dto.name && dto.name !== category.name) {
      changes.push({ field: 'name', old_value: category.name, new_value: dto.name });
      category.name = dto.name;
    }

    if (dto.description && dto.description !== category.description) {
      changes.push({
        field: 'description',
        old_value: category.description,
        new_value: dto.description,
      });
      category.description = dto.description;
    }

    if (dto.image_url && dto.image_url !== category.image_url) {
      changes.push({
        field: 'image_url',
        old_value: category.image_url,
        new_value: dto.image_url,
      });
      category.image_url = dto.image_url;
    }

    const updated = await this.categoriesRepository.save(category);

    // Audit log
    if (changes.length > 0) {
      await this.auditLogger.log({
        userId: adminId,
        resource: 'categories',
        action: 'update',
        entityId: id,
        changes,
        description: `Category updated: ${category.name}`,
      });
    }

    return updated;
  }

  /**
   * Delete category for a specific tenant
   */
  async remove(id: string, tenantId: string, adminId: string): Promise<void> {
    const category = await this.findOne(id, tenantId);  // ← Verify ownership

    // Check if category has products (filtered by tenant)
    const productCount = await this.productsRepository.count({
      where: { category_id: id, tenant_id: tenantId },  // ← Filter by tenant
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${productCount} products. Move products first.`,
      );
    }

    await this.categoriesRepository.delete(id);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'categories',
      action: 'delete',
      entityId: id,
      description: `Category deleted: ${category.name}`,
    });
  }

  /**
   * Get all categories for a specific tenant (simple list)
   */
  async findAllSimple(tenantId: string): Promise<Categeories[]> {
    return this.categoriesRepository.find({
      where: { tenant_id: tenantId },  // ← Filter by tenant
      order: { name: 'ASC' },
    });
  }

  /**
   * Get category with products for a specific tenant
   */
  async getCategoryWithProducts(id: string, tenantId: string, page: number = 1, limit: number = 20) {
    const category = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    const skip = (page - 1) * limit;

    const products = await this.productsRepository.find({
      where: { category_id: id, tenant_id: tenantId },  // ← Filter by tenant
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const total = await this.productsRepository.count({
      where: { category_id: id, tenant_id: tenantId },  // ← Filter by tenant
    });

    return {
      category,
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
