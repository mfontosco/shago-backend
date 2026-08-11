import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { CreateTenantDto, UpdateTenantDto } from '../dtos/create-tenant.dto';

/**
 * Tenants Service
 *
 * Manages multi-tenant organizations:
 * - Create new tenants (vendors)
 * - Manage tenant settings
 * - Track tenant statistics
 * - Enforce tenant quotas
 *
 * Key Responsibility: Tenant lifecycle management
 */
@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  /**
   * Create a new tenant (vendor)
   * Called during vendor registration
   */
  async create(dto: CreateTenantDto): Promise<Tenant> {
    // Validate unique name
    const existingByName = await this.tenantsRepository.findOne({
      where: { name: dto.name },
    });

    if (existingByName) {
      throw new ConflictException('Tenant name already exists');
    }

    // Auto-generate slug if not provided
    let slug = dto.slug || this.generateSlug(dto.name);

    // Validate slug uniqueness
    const existingBySlug = await this.tenantsRepository.findOne({
      where: { slug },
    });

    if (existingBySlug) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Create tenant with trial status
    const tenant = this.tenantsRepository.create({
      name: dto.name,
      slug,
      description: dto.description,
      logo_url: dto.logo_url,
      website: dto.website,
      country: dto.country,
      currency: dto.currency || 'AED', // Default currency
      plan: dto.plan || 'starter', // Default plan
      status: 'trial', // New tenants start in trial
      is_active: true,
      // Trial defaults: 30 days
      subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      // Default quotas for trial
      max_users: 5,
      max_products: 50,
      max_orders: 1000,
    });

    const saved = await this.tenantsRepository.save(tenant);
    return saved;
  }

  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant not found: ${id}`);
    }

    return tenant;
  }

  /**
   * Find tenant by slug (for URL routing)
   */
  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant not found: ${slug}`);
    }

    return tenant;
  }

  /**
   * Find tenant by name
   */
  async findByName(name: string): Promise<Tenant | null> {
    return this.tenantsRepository.findOne({
      where: { name },
    });
  }

  /**
   * List all active tenants (admin only)
   */
  async findAll(page: number = 1, limit: number = 20): Promise<{ data: Tenant[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.tenantsRepository.findAndCount({
      where: { is_active: true },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  /**
   * Update tenant (admin only)
   */
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findById(id);

    // If updating slug, check uniqueness
    if (dto.slug && dto.slug !== tenant.slug) {
      const existing = await this.tenantsRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException('Slug already in use');
      }
    }

    // Update fields
    if (dto.name) tenant.name = dto.name;
    if (dto.slug) tenant.slug = dto.slug;
    if (dto.description !== undefined) tenant.description = dto.description;
    if (dto.logo_url !== undefined) tenant.logo_url = dto.logo_url;
    if (dto.website !== undefined) tenant.website = dto.website;
    if (dto.country !== undefined) tenant.country = dto.country;
    if (dto.currency !== undefined) tenant.currency = dto.currency;
    if (dto.status) tenant.status = dto.status as any;
    if (dto.plan) tenant.plan = dto.plan;

    return this.tenantsRepository.save(tenant);
  }

  /**
   * Soft delete tenant
   */
  async remove(id: string): Promise<void> {
    const tenant = await this.findById(id);
    tenant.is_active = false;
    tenant.status = 'inactive';
    await this.tenantsRepository.save(tenant);
  }

  /**
   * Validate tenant is active and can perform operations
   */
  async validateTenantActive(tenantId: string): Promise<boolean> {
    const tenant = await this.findById(tenantId);

    if (!tenant.is_active) {
      throw new BadRequestException('Tenant is inactive');
    }

    if (tenant.status === 'suspended') {
      throw new BadRequestException('Tenant is suspended');
    }

    if (tenant.isTrialExpired()) {
      throw new BadRequestException('Trial period has expired');
    }

    return true;
  }

  /**
   * Check if tenant can create a new user
   */
  async canCreateUser(tenantId: string): Promise<boolean> {
    const tenant = await this.findById(tenantId);
    return tenant.canCreateUsers();
  }

  /**
   * Increment tenant user count
   */
  async incrementUserCount(tenantId: string): Promise<void> {
    await this.tenantsRepository.increment({ id: tenantId }, 'total_users', 1);
  }

  /**
   * Increment tenant product count
   */
  async incrementProductCount(tenantId: string, count: number = 1): Promise<void> {
    await this.tenantsRepository.increment({ id: tenantId }, 'total_products', count);
  }

  /**
   * Increment tenant order count
   */
  async incrementOrderCount(tenantId: string, count: number = 1): Promise<void> {
    await this.tenantsRepository.increment({ id: tenantId }, 'total_orders', count);
  }

  /**
   * Increment tenant delivery count
   */
  async incrementDeliveryCount(tenantId: string, count: number = 1): Promise<void> {
    await this.tenantsRepository.increment({ id: tenantId }, 'total_deliveries', count);
  }

  /**
   * Helper: Generate URL-safe slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }
}
