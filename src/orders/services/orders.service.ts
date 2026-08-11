import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  AssignRiderDto,
  QueryOrdersDto,
} from '../dtos/create-order.dto';
import { AuditLoggerService } from '../../audit-logs/services/audit-logger.service';
import { Product } from '../../product/entities/products.entities';

/**
 * Orders Service
 *
 * Handles all order operations:
 * - Create orders
 * - List/query orders
 * - Update orders
 * - Assign riders
 * - Change status
 * - Calculate totals
 *
 * Multi-tenancy: All methods filter by tenant_id
 * All queries automatically scoped to vendor's data
 *
 * Used by:
 * - OrdersController (vendor endpoints at /api/v1/vendor/orders)
 * - Dashboard (statistics)
 * - Reports (analytics)
 */
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,

    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    private auditLogger: AuditLoggerService,
  ) {}

  /**
   * Create a new order for a specific tenant
   */
  async create(dto: CreateOrderDto, tenantId: string, adminId?: string): Promise<Order> {
    // Validate items exist
    const productIds = dto.items.map((item) => item.product_id);
    const products = await this.productsRepository.findByIds(productIds);

    if (products.length !== dto.items.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Create order
    const order = this.ordersRepository.create({
      tenant_id: tenantId,  // ← CRITICAL: Set vendor ownership
      user_id: dto.user_id,
      delivery_address: dto.delivery_address,
      delivery_latitude: dto.delivery_latitude,
      delivery_longitude: dto.delivery_longitude,
      payment_method: dto.payment_method as any,
      special_instructions: dto.special_instructions,
      subtotal: 0,
      discount: dto.discount || 0,
      delivery_fee: 0,
      total_price: 0,
      status: 'pending' as OrderStatus,
    });

    // Add items and calculate totals
    let subtotal = 0;
    const items: OrderItem[] = [];

    for (const itemDto of dto.items) {
      const product = products.find((p) => p.id === itemDto.product_id);
      const itemSubtotal = itemDto.unit_price * itemDto.quantity;
      subtotal += itemSubtotal;

      const item = this.orderItemsRepository.create({
        order: order,
        product_id: itemDto.product_id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: itemDto.quantity,
        unit_price: itemDto.unit_price,
        subtotal: itemSubtotal,
        discount: 0,
        total: itemSubtotal,
        variant: itemDto.variant,
        notes: itemDto.notes,
      });

      items.push(item);
    }

    // Calculate totals
    order.subtotal = subtotal;
    order.delivery_fee = this.calculateDeliveryFee(dto.delivery_latitude, dto.delivery_longitude);
    order.total_price = order.subtotal - order.discount + order.delivery_fee;
    order.items = items;

    const savedOrder = await this.ordersRepository.save(order);

    // Audit log
    if (adminId) {
      await this.auditLogger.log({
        userId: adminId,
        resource: 'orders',
        action: 'create',
        entityId: savedOrder.id,
        description: `Order created for user ${dto.user_id}`,
      });
    }

    return savedOrder;
  }

  /**
   * Find all orders for a specific tenant with pagination and filtering
   */
  async findAll(query: QueryOrdersDto, tenantId: string): Promise<{ data: Order[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    let queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.tenant_id = :tenantId', { tenantId })  // ← CRITICAL: Filter by tenant
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    // Apply additional filters on top of tenant filter
    if (query.status) {
      queryBuilder = queryBuilder.andWhere('order.status = :status', { status: query.status });
    }

    if (query.user_id) {
      queryBuilder = queryBuilder.andWhere('order.user_id = :user_id', { user_id: query.user_id });
    }

    if (query.from_date && query.to_date) {
      const fromDate = new Date(query.from_date);
      const toDate = new Date(query.to_date);
      queryBuilder = queryBuilder.andWhere('order.created_at BETWEEN :from AND :to', {
        from: fromDate,
        to: toDate,
      });
    }

    // Apply sorting
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'DESC';
    queryBuilder = queryBuilder.orderBy(`order.${sortBy}`, sortOrder as any);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated data
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    return { data, total };
  }

  /**
   * Find single order by ID - verify tenant ownership
   */
  async findOne(id: string, tenantId: string): Promise<Order> {
    const order = await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('order.id = :id', { id })
      .andWhere('order.tenant_id = :tenantId', { tenantId })  // ← CRITICAL: Verify ownership
      .getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Update order details for a specific tenant
   */
  async update(id: string, dto: UpdateOrderDto, tenantId: string, adminId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    const changes = [];

    if (dto.delivery_address && dto.delivery_address !== order.delivery_address) {
      changes.push({
        field: 'delivery_address',
        old_value: order.delivery_address,
        new_value: dto.delivery_address,
      });
      order.delivery_address = dto.delivery_address;
    }

    if (dto.special_instructions && dto.special_instructions !== order.special_instructions) {
      changes.push({
        field: 'special_instructions',
        old_value: order.special_instructions,
        new_value: dto.special_instructions,
      });
      order.special_instructions = dto.special_instructions;
    }

    const updated = await this.ordersRepository.save(order);

    // Audit log (include tenant_id for audit trail)
    if (changes.length > 0) {
      await this.auditLogger.log({
        userId: adminId,
        resource: 'orders',
        action: 'update',
        entityId: id,
        changes,
        description: 'Order details updated',
      });
    }

    return updated;
  }

  /**
   * Update order status for a specific tenant
   */
  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    tenantId: string,
    adminId: string,
  ): Promise<Order> {
    const order = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    const oldStatus = order.status;
    order.status = dto.status as OrderStatus;

    if (dto.status === 'delivered') {
      order.delivered_at = new Date();
    }

    const updated = await this.ordersRepository.save(order);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'orders',
      action: 'update',
      entityId: id,
      changes: [
        {
          field: 'status',
          old_value: oldStatus,
          new_value: dto.status,
        },
      ],
      description: `Order status changed to ${dto.status}`,
    });

    return updated;
  }

  /**
   * Assign rider to order for a specific tenant
   */
  async assignRider(id: string, dto: AssignRiderDto, tenantId: string, adminId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    if (!order.canAssignRider()) {
      throw new BadRequestException(
        `Cannot assign rider to order with status: ${order.status}`,
      );
    }

    const oldRider = order.rider_id;
    order.rider_id = dto.rider_id;
    order.estimated_delivery_time = dto.estimated_delivery_time || 30;

    const updated = await this.ordersRepository.save(order);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'orders',
      action: 'update',
      entityId: id,
      changes: [
        {
          field: 'rider_id',
          old_value: oldRider,
          new_value: dto.rider_id,
        },
      ],
      description: `Rider ${dto.rider_id} assigned to order`,
    });

    return updated;
  }

  /**
   * Cancel order for a specific tenant
   */
  async cancel(id: string, reason: string, tenantId: string, adminId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);  // ← Pass tenantId for verification

    if (!order.canBeCancelled()) {
      throw new BadRequestException(`Cannot cancel order with status: ${order.status}`);
    }

    order.status = 'cancelled';
    const updated = await this.ordersRepository.save(order);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'orders',
      action: 'update',
      entityId: id,
      changes: [
        {
          field: 'status',
          old_value: 'pending',
          new_value: 'cancelled',
        },
      ],
      description: `Order cancelled. Reason: ${reason}`,
    });

    return updated;
  }

  /**
   * Get dashboard statistics for a specific tenant
   */
  async getDashboardStats(tenantId: string): Promise<{
    total_orders: number;
    pending_orders: number;
    confirmed_orders: number;
    delivered_orders: number;
    total_revenue: number;
    average_order_value: number;
  }> {
    // ← CRITICAL: Filter all counts by tenant_id
    const total = await this.ordersRepository.count({ where: { tenant_id: tenantId } });
    const pending = await this.ordersRepository.count({ where: { tenant_id: tenantId, status: 'pending' } });
    const confirmed = await this.ordersRepository.count({ where: { tenant_id: tenantId, status: 'confirmed' } });
    const delivered = await this.ordersRepository.count({ where: { tenant_id: tenantId, status: 'delivered' } });

    const orders = await this.ordersRepository.find({ where: { tenant_id: tenantId } });
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price), 0);
    const avgOrderValue = total > 0 ? totalRevenue / total : 0;

    return {
      total_orders: total,
      pending_orders: pending,
      confirmed_orders: confirmed,
      delivered_orders: delivered,
      total_revenue: Number(totalRevenue.toFixed(2)),
      average_order_value: Number(avgOrderValue.toFixed(2)),
    };
  }

  /**
   * Get today's sales for a specific tenant
   */
  async getTodaysSales(tenantId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ← CRITICAL: Filter by tenant_id
    const orders = await this.ordersRepository.find({
      where: {
        tenant_id: tenantId,
        created_at: Between(today, tomorrow),
        status: In(['completed', 'delivered']),
      },
    });

    return orders.reduce((sum, order) => sum + Number(order.total_price), 0);
  }

  /**
   * Helper: Calculate delivery fee based on distance
   */
  private calculateDeliveryFee(latitude: number, longitude: number): number {
    // Simple calculation: would be replaced with real geolocation logic
    // For now, flat fee of 5 for all deliveries
    return 5;
  }

  /**
   * Delete (soft delete) an order for a specific tenant
   */
  async remove(id: string, tenantId: string, adminId: string): Promise<void> {
    const order = await this.findOne(id, tenantId);  // ← Verify ownership before deleting

    await this.ordersRepository.softDelete(id);

    // Audit log
    await this.auditLogger.log({
      userId: adminId,
      resource: 'orders',
      action: 'delete',
      entityId: id,
      description: 'Order soft deleted',
    });
  }
}
