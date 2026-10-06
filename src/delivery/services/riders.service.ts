import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Rider } from '../entities/rider.entity';
import { Delivery } from '../entities/delivery.entity';
import { QueryRidersDto } from '../dtos/create-delivery.dto';
import { AuditLoggerService } from '../../audit-logs/services/audit-logger.service';

/**
 * Riders Service
 *
 * Handles rider management:
 * - Create/update riders
 * - Track performance metrics
 * - Calculate completion rates
 * - Manage rider status
 *
 * Multi-tenancy: All methods filter by tenant_id
 * Riders are isolated per vendor
 *
 * Used by:
 * - RidersController (vendor endpoints at /api/v1/vendor/riders)
 * - DeliveriesService (when assigning to orders)
 * - Dashboard (rider stats)
 */
@Injectable()
export class RidersService {
  constructor(
    @InjectRepository(Rider)
    private riderRepository: Repository<Rider>,

    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,

    private auditLogger: AuditLoggerService,
  ) {}

  /**
   * Create new rider for specific tenant
   */
  async create(
    data: {
      name: string;
      phone: string;
      email?: string;
      vehicle_type?: string;
      vehicle_plate?: string;
    },
    tenantId: string,
    adminId?: string,
  ): Promise<Rider> {
    // Check phone uniqueness per tenant
    const existing = await this.riderRepository.findOne({
      where: { phone: data.phone, tenant_id: tenantId },  // ← Unique per tenant
    });

    if (existing) {
      throw new BadRequestException('Phone number already registered');
    }

    const rider = this.riderRepository.create({
      tenant_id: tenantId,  // ← CRITICAL: Set vendor ownership
      name: data.name,
      phone: data.phone,
      email: data.email,
      vehicle_type: data.vehicle_type,
      vehicle_plate: data.vehicle_plate,
      status: 'available',
      rating: 5,
      completion_rate: 100,
      is_active: true,
    });

    const saved = await this.riderRepository.save(rider);

    // Audit log
    if (adminId) {
      await this.auditLogger.log({
        userId: adminId,
        resource: 'riders',
        action: 'create',
        entityId: saved.id,
        description: `Rider created: ${data.name}`,
      });
    }

    return saved;
  }

  /**
   * Find all riders with pagination - for specific tenant
   */
  async findAll(query: QueryRidersDto, tenantId: string): Promise<{
    data: Rider[];
    total: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    let queryBuilder = this.riderRepository.createQueryBuilder('rider')
      .where('rider.tenant_id = :tenantId', { tenantId });  // ← CRITICAL: Filter by tenant

    // Apply filters
    if (query.status) {
      queryBuilder = queryBuilder.andWhere('rider.status = :status', {
        status: query.status,
      });
    }

    if (query.search) {
      queryBuilder = queryBuilder.andWhere(
        '(rider.name ILIKE :search OR rider.phone ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Apply sorting
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'DESC';
    queryBuilder = queryBuilder.orderBy(`rider.${sortBy}`, sortOrder as any);

    // Get total
    const total = await queryBuilder.getCount();

    // Get paginated data
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    return { data, total };
  }

  /**
   * Find single rider - verify tenant ownership
   */
  async findOne(id: string, tenantId: string): Promise<Rider> {
    const rider = await this.riderRepository.findOne({
      where: { id, tenant_id: tenantId },  // ← CRITICAL: Verify ownership
      relations: ['deliveries'],
    });

    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    return rider;
  }

  /**
   * Update rider for specific tenant
   */
  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      vehicle_type?: string;
      vehicle_plate?: string;
      notes?: string;
    },
    tenantId: string,
    adminId: string,
  ): Promise<Rider> {
    const rider = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    const changes: any[] = [];

    if (data.name && data.name !== rider.name) {
      changes.push({
        field: 'name',
        old_value: rider.name,
        new_value: data.name,
      });
      rider.name = data.name;
    }

    if (data.email && data.email !== rider.email) {
      changes.push({
        field: 'email',
        old_value: rider.email,
        new_value: data.email,
      });
      rider.email = data.email;
    }

    if (data.vehicle_type && data.vehicle_type !== rider.vehicle_type) {
      changes.push({
        field: 'vehicle_type',
        old_value: rider.vehicle_type,
        new_value: data.vehicle_type,
      });
      rider.vehicle_type = data.vehicle_type;
    }

    if (data.vehicle_plate && data.vehicle_plate !== rider.vehicle_plate) {
      changes.push({
        field: 'vehicle_plate',
        old_value: rider.vehicle_plate,
        new_value: data.vehicle_plate,
      });
      rider.vehicle_plate = data.vehicle_plate;
    }

    if (data.notes && data.notes !== rider.notes) {
      changes.push({
        field: 'notes',
        old_value: rider.notes,
        new_value: data.notes,
      });
      rider.notes = data.notes;
    }

    const updated = await this.riderRepository.save(rider);

    // Audit log
    if (changes.length > 0) {
      await this.auditLogger.log({
        userId: adminId,
        resource: 'riders',
        action: 'update',
        entityId: id,
        changes,
        description: `Rider updated: ${rider.name}`,
      });
    }

    return updated;
  }

  /**
   * Update rider status for specific tenant
   */
  async updateStatus(
    id: string,
    status: 'available' | 'unavailable' | 'on_delivery' | 'on_break' | 'inactive',
    tenantId: string,
    adminId?: string,
  ): Promise<Rider> {
    const rider = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    const oldStatus = rider.status;
    rider.status = status;

    const updated = await this.riderRepository.save(rider);

    // Audit log
    if (adminId) {
      await this.auditLogger.log({
        userId: adminId,
        resource: 'riders',
        action: 'update_status',
        entityId: id,
        changes: [
          {
            field: 'status',
            old_value: oldStatus,
            new_value: status,
          },
        ],
        description: `Rider status changed to ${status}`,
      });
    }

    return updated;
  }

  /**
   * Update rider performance after delivery for specific tenant
   */
  async updatePerformance(
    riderId: string,
    tenantId: string,
    deliveryStatus: 'delivered' | 'failed' | 'cancelled',
  ): Promise<void> {
    const rider = await this.findOne(riderId, tenantId);  // ← Pass tenantId for verification

    if (deliveryStatus === 'delivered') {
      rider.completed_deliveries += 1;
    } else if (deliveryStatus === 'failed' || deliveryStatus === 'cancelled') {
      rider.cancelled_deliveries += 1;
    }

    rider.total_deliveries += 1;

    // Recalculate completion rate
    if (rider.total_deliveries > 0) {
      rider.completion_rate = (
        (rider.completed_deliveries / rider.total_deliveries) *
        100
      ).toFixed(2) as any;
    }

    await this.riderRepository.save(rider);
  }

  /**
   * Delete rider for specific tenant
   */
  async remove(id: string, tenantId: string, adminId: string): Promise<void> {
    const rider = await this.findOne(id, tenantId);  // ← Verify ownership

    // Check for pending deliveries
    const pendingDeliveries = await this.deliveryRepository.count({
      where: { rider_id: id, status: 'assigned' },
    });

    if (pendingDeliveries > 0) {
      throw new BadRequestException(
        `Cannot delete rider with ${pendingDeliveries} pending deliveries`,
      );
    }

    rider.is_active = false;
    rider.status = 'inactive';

    await this.riderRepository.save(rider);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'riders',
      action: 'delete',
      entityId: id,
      description: `Rider deactivated: ${rider.name}`,
    });
  }

  /**
   * Get rider statistics for specific tenant
   */
  async getStats(tenantId: string) {
    // ← CRITICAL: Filter all counts by tenant_id
    const [
      total_riders,
      available,
      on_delivery,
      inactive,
      top_performer,
    ] = await Promise.all([
      this.riderRepository.count({ where: { tenant_id: tenantId, is_active: true } }),
      this.riderRepository.count({ where: { tenant_id: tenantId, status: 'available' } }),
      this.riderRepository.count({
        where: { tenant_id: tenantId, status: 'on_delivery' },
      }),
      this.riderRepository.count({ where: { tenant_id: tenantId, is_active: false } }),
      this.riderRepository.findOne({
        where: { tenant_id: tenantId, is_active: true },
        order: { completion_rate: 'DESC' },
      }),
    ]);

    return {
      total_riders,
      available,
      on_delivery,
      inactive,
      top_performer: top_performer?.toSummary() || null,
    };
  }

  /**
   * Get available riders for specific tenant
   */
  async getAvailable(tenantId: string): Promise<Rider[]> {
    return this.riderRepository.find({
      where: { tenant_id: tenantId, status: 'available', is_active: true },  // ← Filter by tenant
      order: { rating: 'DESC' },
    });
  }

  /**
   * Get rider with performance metrics for specific tenant
   */
  async getRiderWithMetrics(id: string, tenantId: string) {
    const rider = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    return {
      ...rider,
      metrics: rider.getPerformanceMetrics(),
    };
  }
}
