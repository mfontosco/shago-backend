import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Delivery } from '../entities/delivery.entity';
import { Order } from '../../orders/entities/order.entity';
import {
  CreateDeliveryDto,
  UpdateDeliveryDto,
  AssignRiderDto,
  UpdateDeliveryStatusDto,
  QueryDeliveriesDto,
  UpdateRiderLocationDto,
} from '../dtos/create-delivery.dto';
import { AuditLoggerService } from '../../audit-logs/services/audit-logger.service';

/**
 * Deliveries Service
 *
 * Handles delivery management:
 * - Create deliveries from orders
 * - Assign riders
 * - Track delivery progress
 * - Calculate delivery statistics
 *
 * Multi-tenancy: All methods filter by tenant_id
 * Deliveries are isolated per vendor
 *
 * Used by:
 * - DeliveriesController (vendor endpoints at /api/v1/vendor/deliveries)
 * - OrdersService (when creating orders)
 * - Dashboard (delivery stats)
 */
@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,

    @InjectRepository(Order)
    private orderRepository: Repository<Order>,

    private auditLogger: AuditLoggerService,
  ) {}

  /**
   * Create delivery for an order - for specific tenant
   */
  async create(dto: CreateDeliveryDto, tenantId: string, adminId?: string): Promise<Delivery> {
    // Verify order exists and belongs to tenant
    const order = await this.orderRepository.findOne({
      where: { id: dto.order_id, tenant_id: tenantId },  // ← Verify ownership
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if delivery already exists
    const existing = await this.deliveryRepository.findOne({
      where: { order_id: dto.order_id },
    });

    if (existing) {
      throw new BadRequestException('Delivery already exists for this order');
    }

    const delivery = this.deliveryRepository.create({
      tenant_id: tenantId,  // ← CRITICAL: Set vendor ownership
      order_id: dto.order_id,
      pickup_address: dto.pickup_address || 'Warehouse',
      delivery_address: dto.delivery_address || order.delivery_address,
      recipient_name: dto.recipient_name,
      recipient_phone: dto.recipient_phone,
      estimated_delivery_time: dto.estimated_delivery_time || 2,
      delivery_fee: dto.delivery_fee || 0,
      notes: dto.notes,
      status: 'pending',
    });

    const saved = await this.deliveryRepository.save(delivery);

    // Audit log
    if (adminId) {
      await this.auditLogger.log({
        userId: adminId,
        resource: 'deliveries',
        action: 'create',
        entityId: saved.id,
        description: `Delivery created for order ${dto.order_id}`,
      });
    }

    return saved;
  }

  /**
   * Find all deliveries with filters - for specific tenant
   */
  async findAll(query: QueryDeliveriesDto, tenantId: string): Promise<{
    data: Delivery[];
    total: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    let queryBuilder = this.deliveryRepository.createQueryBuilder('delivery')
      .where('delivery.tenant_id = :tenantId', { tenantId });  // ← CRITICAL: Filter by tenant

    // Apply filters
    if (query.status) {
      queryBuilder = queryBuilder.andWhere('delivery.status = :status', {
        status: query.status,
      });
    }

    if (query.rider_id) {
      queryBuilder = queryBuilder.andWhere('delivery.rider_id = :rider_id', {
        rider_id: query.rider_id,
      });
    }

    if (query.order_id) {
      queryBuilder = queryBuilder.andWhere('delivery.order_id = :order_id', {
        order_id: query.order_id,
      });
    }

    // Apply sorting
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'DESC';
    queryBuilder = queryBuilder.orderBy(
      `delivery.${sortBy}`,
      sortOrder as any,
    );

    // Get total
    const total = await queryBuilder.getCount();

    // Get paginated data
    const data = await queryBuilder
      .leftJoinAndSelect('delivery.rider', 'rider')
      .leftJoinAndSelect('delivery.order', 'order')
      .skip(skip)
      .take(limit)
      .getMany();

    return { data, total };
  }

  /**
   * Find single delivery by ID - verify tenant ownership
   */
  async findOne(id: string, tenantId: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id, tenant_id: tenantId },  // ← CRITICAL: Verify ownership
      relations: ['rider', 'order'],
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return delivery;
  }

  /**
   * Update delivery details for specific tenant
   */
  async update(
    id: string,
    dto: UpdateDeliveryDto,
    tenantId: string,
    adminId: string,
  ): Promise<Delivery> {
    const delivery = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    const changes = [];

    if (
      dto.delivery_address &&
      dto.delivery_address !== delivery.delivery_address
    ) {
      changes.push({
        field: 'delivery_address',
        old_value: delivery.delivery_address,
        new_value: dto.delivery_address,
      });
      delivery.delivery_address = dto.delivery_address;
    }

    if (
      dto.recipient_name &&
      dto.recipient_name !== delivery.recipient_name
    ) {
      changes.push({
        field: 'recipient_name',
        old_value: delivery.recipient_name,
        new_value: dto.recipient_name,
      });
      delivery.recipient_name = dto.recipient_name;
    }

    if (
      dto.recipient_phone &&
      dto.recipient_phone !== delivery.recipient_phone
    ) {
      changes.push({
        field: 'recipient_phone',
        old_value: delivery.recipient_phone,
        new_value: dto.recipient_phone,
      });
      delivery.recipient_phone = dto.recipient_phone;
    }

    if (
      dto.estimated_delivery_time &&
      dto.estimated_delivery_time !== delivery.estimated_delivery_time
    ) {
      changes.push({
        field: 'estimated_delivery_time',
        old_value: delivery.estimated_delivery_time,
        new_value: dto.estimated_delivery_time,
      });
      delivery.estimated_delivery_time = dto.estimated_delivery_time;
    }

    if (dto.notes && dto.notes !== delivery.notes) {
      changes.push({
        field: 'notes',
        old_value: delivery.notes,
        new_value: dto.notes,
      });
      delivery.notes = dto.notes;
    }

    const updated = await this.deliveryRepository.save(delivery);

    // Audit log
    if (changes.length > 0) {
      await this.auditLogger.log({
        userId: adminId,
        resource: 'deliveries',
        action: 'update',
        entityId: id,
        changes,
        description: `Delivery updated for order ${delivery.order_id}`,
      });
    }

    return updated;
  }

  /**
   * Assign rider to delivery for specific tenant
   */
  async assignRider(
    id: string,
    dto: AssignRiderDto,
    tenantId: string,
    adminId: string,
  ): Promise<Delivery> {
    const delivery = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    if (!delivery.canBeAssigned()) {
      throw new BadRequestException(
        `Cannot assign rider to delivery with status: ${delivery.status}`,
      );
    }

    delivery.rider_id = dto.rider_id;
    delivery.status = 'assigned';
    delivery.delivery_fee = dto.delivery_fee || delivery.delivery_fee;

    const updated = await this.deliveryRepository.save(delivery);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'deliveries',
      action: 'assign_rider',
      entityId: id,
      changes: [
        {
          field: 'rider_id',
          old_value: null,
          new_value: dto.rider_id,
        },
        {
          field: 'status',
          old_value: 'pending',
          new_value: 'assigned',
        },
      ],
      description: `Delivery assigned to rider ${dto.rider_id}`,
    });

    return updated;
  }

  /**
   * Update delivery status for specific tenant
   */
  async updateStatus(
    id: string,
    dto: UpdateDeliveryStatusDto,
    tenantId: string,
    adminId: string,
  ): Promise<Delivery> {
    const delivery = await this.findOne(id, tenantId);  // ← Pass tenantId for verification
    const oldStatus = delivery.status;

    // Validate status transitions
    if (dto.status === 'delivered' && !delivery.canBeDelivered()) {
      throw new BadRequestException(
        `Cannot mark as delivered from status: ${delivery.status}`,
      );
    }

    if (dto.status === 'cancelled' && !delivery.canBeCancelled()) {
      throw new BadRequestException(
        `Cannot cancel delivery with status: ${delivery.status}`,
      );
    }

    delivery.status = dto.status;

    if (dto.status === 'delivered') {
      delivery.delivery_time = new Date();
    }

    if (dto.status === 'failed') {
      delivery.rejection_reason = dto.rejection_reason;
      delivery.delivery_attempts = (delivery.delivery_attempts || 0) + 1;
    }

    if (dto.delivery_proof_url) {
      delivery.delivery_proof_url = dto.delivery_proof_url;
    }

    const updated = await this.deliveryRepository.save(delivery);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'deliveries',
      action: 'update_status',
      entityId: id,
      changes: [
        {
          field: 'status',
          old_value: oldStatus,
          new_value: dto.status,
        },
      ],
      description: `Delivery status changed to ${dto.status}`,
    });

    return updated;
  }

  /**
   * Update rider location
   */
  async updateRiderLocation(
    deliveryId: string,
    dto: UpdateRiderLocationDto,
    riderId: string,
  ): Promise<Delivery> {
    const delivery = await this.findOne(deliveryId);

    if (delivery.rider_id !== riderId) {
      throw new BadRequestException('Not assigned to this delivery');
    }

    delivery.current_latitude = dto.latitude;
    delivery.current_longitude = dto.longitude;
    delivery.current_location = dto.current_location;

    return this.deliveryRepository.save(delivery);
  }

  /**
   * Cancel delivery for specific tenant
   */
  async cancel(id: string, tenantId: string, adminId: string): Promise<Delivery> {
    const delivery = await this.findOne(id, tenantId);  // ← Verify ownership

    if (!delivery.canBeCancelled()) {
      throw new BadRequestException(
        `Cannot cancel delivery with status: ${delivery.status}`,
      );
    }

    delivery.status = 'cancelled';
    const updated = await this.deliveryRepository.save(delivery);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'deliveries',
      action: 'cancel',
      entityId: id,
      description: `Delivery cancelled`,
    });

    return updated;
  }

  /**
   * Get delivery statistics for specific tenant
   */
  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ← CRITICAL: Filter all counts by tenant_id
    const [total, delivered, pending, failed, todays_deliveries] =
      await Promise.all([
        this.deliveryRepository.count({ where: { tenant_id: tenantId } }),
        this.deliveryRepository.count({ where: { tenant_id: tenantId, status: 'delivered' } }),
        this.deliveryRepository.count({
          where: {
            tenant_id: tenantId,
            status: 'pending',
          },
        }),
        this.deliveryRepository.count({ where: { tenant_id: tenantId, status: 'failed' } }),
        this.deliveryRepository.count({
          where: {
            tenant_id: tenantId,
            status: 'delivered',
            delivery_time: Between(today, tomorrow),
          },
        }),
      ]);

    return {
      total_deliveries: total,
      delivered: delivered,
      pending: pending,
      failed: failed,
      todays_deliveries: todays_deliveries,
      delivery_rate: total > 0 ? ((delivered / total) * 100).toFixed(2) : 0,
    };
  }

  /**
   * Get pending deliveries count for specific tenant
   */
  async getPendingCount(tenantId: string): Promise<number> {
    return this.deliveryRepository.count({
      where: { tenant_id: tenantId, status: 'pending' },  // ← Filter by tenant
    });
  }
}
