import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, LessThan } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Categeories } from '../../categories/entities/categories.entities';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateStockDto,
  QueryProductsDto,
} from '../dtos/create-product.dto';
import { AuditLoggerService } from '../../audit-logs/services/audit-logger.service';

/**
 * Products Service
 *
 * Handles product management:
 * - Create products
 * - List/search products
 * - Update product details
 * - Manage stock/inventory
 * - Archive products
 *
 * Multi-tenancy: All methods filter by tenant_id
 * Products are isolated per vendor
 *
 * Used by:
 * - ProductsController (vendor endpoints at /api/v1/vendor/products)
 * - Dashboard (product count, low stock alerts)
 * - Reports (product analytics)
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(Categeories)
    private categoriesRepository: Repository<Categeories>,

    private auditLogger: AuditLoggerService,
  ) {}

  /**
   * Create a new product for a specific tenant
   */
  async create(dto: CreateProductDto, tenantId: string, adminId?: string): Promise<Product> {
    // Validate category exists
    const category = await this.categoriesRepository.findOne({
      where: { id: dto.category_id },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // Check SKU is unique
    const existing = await this.productsRepository.findOne({
      where: { sku: dto.sku },
    });

    if (existing) {
      throw new BadRequestException('SKU already exists');
    }

    // Create product
    const product = this.productsRepository.create({
      tenant_id: tenantId,  // ← CRITICAL: Set vendor ownership
      name: dto.name,
      description: dto.description,
      sku: dto.sku,
      price: dto.price,
      stock_quantity: dto.stock_quantity,
      category_id: dto.category_id,
      image_url: dto.image_url,
      status: (dto.status || 'active') as any,
    });

    const saved = await this.productsRepository.save(product);

    // Audit log
    if (adminId) {
      await this.auditLogger.log({
        userId: adminId,
        resource: 'products',
        action: 'create',
        entityId: saved.id,
        description: `Product created: ${dto.name}`,
      });
    }

    return saved;
  }

  /**
   * Find all products for a specific tenant with filters and pagination
   */
  async findAll(query: QueryProductsDto, tenantId: string): Promise<{ data: Product[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    let queryBuilder = this.productsRepository.createQueryBuilder('product')
      .where('product.tenant_id = :tenantId', { tenantId });  // ← CRITICAL: Filter by tenant

    // Apply filters
    if (query.category_id) {
      queryBuilder = queryBuilder.andWhere('product.category_id = :category_id', {
        category_id: query.category_id,
      });
    }

    if (query.status) {
      queryBuilder = queryBuilder.andWhere('product.status = :status', {
        status: query.status,
      });
    }

    if (query.search) {
      queryBuilder = queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.min_price !== undefined && query.max_price !== undefined) {
      queryBuilder = queryBuilder.andWhere(
        'product.price BETWEEN :min AND :max',
        { min: query.min_price, max: query.max_price },
      );
    }

    if (query.low_stock_only) {
      queryBuilder = queryBuilder.andWhere('product.stock_quantity < 10'); // Low stock threshold
    }

    // Apply sorting
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'DESC';
    queryBuilder = queryBuilder.orderBy(`product.${sortBy}`, sortOrder as any);

    // Get total
    const total = await queryBuilder.getCount();

    // Get paginated data
    const data = await queryBuilder
      .leftJoinAndSelect('product.category', 'category')
      .skip(skip)
      .take(limit)
      .getMany();

    return { data, total };
  }

  /**
   * Find single product by ID - verify tenant ownership
   */
  async findOne(id: string, tenantId: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, tenant_id: tenantId },  // ← CRITICAL: Verify ownership
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Update product details for a specific tenant
   */
  async update(id: string, dto: UpdateProductDto, tenantId: string, adminId: string): Promise<Product> {
    const product = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    const changes: any[] = [];

    if (dto.name && dto.name !== product.name) {
      changes.push({ field: 'name', old_value: product.name, new_value: dto.name });
      product.name = dto.name;
    }

    if (dto.description && dto.description !== product.description) {
      changes.push({
        field: 'description',
        old_value: product.description,
        new_value: dto.description,
      });
      product.description = dto.description;
    }

    if (dto.price !== undefined && dto.price !== product.price) {
      changes.push({ field: 'price', old_value: product.price, new_value: dto.price });
      product.price = dto.price;
    }

    if (dto.stock_quantity !== undefined && dto.stock_quantity !== product.stock_quantity) {
      changes.push({ field: 'stock_quantity', old_value: product.stock_quantity, new_value: dto.stock_quantity });
      product.stock_quantity = dto.stock_quantity;
    }

    if (dto.status && dto.status !== product.status) {
      changes.push({ field: 'status', old_value: product.status, new_value: dto.status });
      product.status = dto.status as any;
    }

    const updated = await this.productsRepository.save(product);

    // Audit log
    if (changes.length > 0) {
      await this.auditLogger.log({
        userId: adminId,
        resource: 'products',
        action: 'update',
        entityId: id,
        changes,
        description: `Product updated: ${product.name}`,
      });
    }

    return updated;
  }

  /**
   * Update product stock for a specific tenant
   */
  async updateStock(
    id: string,
    dto: UpdateStockDto,
    tenantId: string,
    adminId: string,
  ): Promise<Product> {
    const product = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    const oldStock = product.stock_quantity;
    let newStock = oldStock;

    if (dto.action === 'add') {
      newStock = oldStock + dto.quantity;
    } else if (dto.action === 'remove') {
      newStock = oldStock - dto.quantity;
      if (newStock < 0) {
        throw new BadRequestException('Insufficient stock');
      }
    } else if (dto.action === 'set') {
      newStock = dto.quantity;
    }

    product.stock_quantity = newStock;
    const updated = await this.productsRepository.save(product);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'products',
      action: 'update',
      entityId: id,
      changes: [
        {
          field: 'stock_quantity',
          old_value: oldStock,
          new_value: newStock,
        },
      ],
      description: `Stock updated for ${product.name}: ${dto.action} ${dto.quantity}. Reason: ${dto.reason || 'N/A'}`,
    });

    return updated;
  }

  /**
   * Get low stock alerts for a specific tenant
   */
  async getLowStockAlerts(tenantId: string, threshold: number = 10): Promise<Product[]> {
    return this.productsRepository.find({
      where: { tenant_id: tenantId, stock_quantity: LessThan(threshold), status: 'active' },  // ← Filter by tenant
      order: { stock_quantity: 'ASC' },
      take: 20,
    });
  }

  /**
   * Search products for a specific tenant
   */
  async search(query: string, tenantId: string): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenantId', { tenantId })  // ← Filter by tenant
      .andWhere(
        '(product.name ILIKE :query OR product.sku ILIKE :query OR product.description ILIKE :query)',
        { query: `%${query}%` }
      )
      .take(10)
      .getMany();
  }

  /**
   * Archive product for a specific tenant
   */
  async archive(id: string, tenantId: string, adminId: string): Promise<Product> {
    const product = await this.findOne(id, tenantId);  // ← Verify ownership

    product.status = 'archived';
    const updated = await this.productsRepository.save(product);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'products',
      action: 'update',
      entityId: id,
      changes: [
        {
          field: 'status',
          old_value: 'active',
          new_value: 'archived',
        },
      ],
      description: `Product archived: ${product.name}`,
    });

    return updated;
  }

  /**
   * Delete (soft delete) product for a specific tenant
   */
  async remove(id: string, tenantId: string, adminId: string): Promise<void> {
    const product = await this.findOne(id, tenantId);  // ← Verify ownership

    await this.productsRepository.softDelete(id);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'products',
      action: 'delete',
      entityId: id,
      description: `Product deleted: ${product.name}`,
    });
  }

  /**
   * Get product count for a specific tenant
   */
  async getCount(tenantId: string): Promise<number> {
    return this.productsRepository.count({ where: { tenant_id: tenantId, status: 'active' } });  // ← Filter by tenant
  }

  /**
   * Get total inventory value for a specific tenant
   */
  async getInventoryValue(tenantId: string): Promise<number> {
    const products = await this.productsRepository.find({ where: { tenant_id: tenantId } });  // ← Filter by tenant
    return products.reduce((sum, p) => sum + Number(p.price) * p.stock_quantity, 0);
  }
}
