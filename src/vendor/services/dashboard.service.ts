import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Product } from '../../products/entities/product.entity';
import { Delivery } from '../../delivery/entities/delivery.entity';
import { Rider } from '../../delivery/entities/rider.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entities';
import { OrderItem } from '../../orders/entities/order-item.entity';

/**
 * Dashboard Service
 *
 * Aggregates vendor business metrics for the dashboard
 * Provides:
 * - Summary cards (KPIs)
 * - Sales trends
 * - Product breakdown
 * - Low stock alerts
 * - Top selling products
 * - Tenant information
 *
 * All data filtered by tenant_id for multi-tenancy
 */
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Delivery)
    private deliveriesRepository: Repository<Delivery>,
    @InjectRepository(Rider)
    private ridersRepository: Repository<Rider>,
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Get dashboard summary cards (KPIs)
   * Returns: total orders, revenue, active products, pending deliveries
   */
  async getSummary(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all orders for revenue calculation
    const [allOrders, totalCount] = await this.ordersRepository.findAndCount({
      where: { tenant_id: tenantId },
    });

    // Calculate total revenue
    const totalRevenue = allOrders.reduce(
      (sum, order) => sum + Number(order.total_price),
      0,
    );

    // Get today's orders
    const todaysOrders = await this.ordersRepository.count({
      where: {
        tenant_id: tenantId,
        created_at: Between(today, tomorrow),
      },
    });

    // Get active products
    const activeProducts = await this.productsRepository.count({
      where: {
        tenant_id: tenantId,
        status: 'active',
      },
    });

    // Get pending deliveries
    const pendingDeliveries = await this.deliveriesRepository.count({
      where: {
        tenant_id: tenantId,
        status: 'pending',
      },
    });

    // Average order value
    const averageOrderValue =
      totalCount > 0 ? totalRevenue / totalCount : 0;

    return {
      total_orders: totalCount,
      todays_orders: todaysOrders,
      total_revenue: Number(totalRevenue.toFixed(2)),
      average_order_value: Number(averageOrderValue.toFixed(2)),
      active_products: activeProducts,
      pending_deliveries: pendingDeliveries,
    };
  }

  /**
   * Get sales trend data for line/area chart
   * Returns last 30 days of daily sales
   */
  async getSalesTrend(tenantId: string, days: number = 30) {
    const data: any[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const orders = await this.ordersRepository.find({
        where: {
          tenant_id: tenantId,
          created_at: Between(date, nextDate),
          status: 'delivered',
        },
      });

      const dailyRevenue = orders.reduce(
        (sum, order) => sum + Number(order.total_price),
        0,
      );

      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Number(dailyRevenue.toFixed(2)),
        orders: orders.length,
      });
    }

    return data;
  }

  /**
   * Get product category breakdown for pie chart
   * Shows sales by product category
   */
  async getProductBreakdown(tenantId: string) {
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('product.category_id', 'category_id')
      .addSelect('COUNT(product.id)', 'order_count')
      .addSelect('SUM(order_item.quantity)', 'total_quantity')
      .addSelect('SUM(order_item.subtotal)', 'total_revenue')
      .leftJoin('order.items', 'order_item')
      .leftJoin('order_item.product', 'product')
      .where('order.tenant_id = :tenantId', { tenantId })
      .andWhere('order.status = :status', { status: 'delivered' })
      .groupBy('product.category_id')
      .getRawMany();

    // Get category names
    const breakdown: any[] = [];
    for (const row of result) {
      const category = row.category_id || 'Uncategorized';
      breakdown.push({
        category: category,
        count: parseInt(row.order_count || '0'),
        quantity: parseInt(row.total_quantity || '0'),
        revenue: Number(parseFloat(row.total_revenue || '0').toFixed(2)),
      });
    }

    return breakdown;
  }

  /**
   * Get low stock alert products
   * Shows products below stock threshold for table
   */
  async getLowStockAlerts(tenantId: string, threshold: number = 10) {
    return this.productsRepository.find({
      where: {
        tenant_id: tenantId,
        status: 'active',
      },
    })
    .then(products =>
      products
        .filter(p => p.stock < threshold)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10) // Top 10 low stock items
        .map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          stock: product.stock,
          threshold: threshold,
          status: product.stock === 0 ? 'out' : product.stock < threshold / 2 ? 'critical' : 'low',
        }))
    );
  }

  /**
   * Get top selling products
   * Shows best performing products by revenue or quantity
   */
  async getTopSellingProducts(
    tenantId: string,
    limit: number = 10,
    sortBy: 'revenue' | 'quantity' = 'revenue',
  ) {
    const result = await this.orderItemsRepository
      .createQueryBuilder('order_item')
      .select('product.id', 'id')
      .addSelect('product.name', 'name')
      .addSelect('product.sku', 'sku')
      .addSelect('SUM(order_item.quantity)', 'total_quantity')
      .addSelect('SUM(order_item.subtotal)', 'total_revenue')
      .leftJoin('order_item.product', 'product')
      .leftJoin('product.order_items', 'orders')
      .where('product.tenant_id = :tenantId', { tenantId })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.sku')
      .orderBy(
        sortBy === 'revenue'
          ? 'SUM(order_item.subtotal)'
          : 'SUM(order_item.quantity)',
        'DESC',
      )
      .limit(limit)
      .getRawMany();

    return result.map(row => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      quantity_sold: parseInt(row.total_quantity || '0'),
      revenue: Number(parseFloat(row.total_revenue || '0').toFixed(2)),
    }));
  }

  /**
   * Get tenant information with trial status
   */
  async getTenantInfo(tenantId: string) {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      return null;
    }

    // Calculate trial days remaining
    const now = new Date();
    const expiry = new Date(tenant.subscription_expires_at);
    const daysRemaining = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      plan: tenant.plan,
      currency: tenant.currency,
      is_active: tenant.is_active,
      trial_expires_at: tenant.subscription_expires_at,
      trial_days_remaining: Math.max(0, daysRemaining),
      is_trial_expired: tenant.isTrialExpired(),
      quotas: {
        max_users: tenant.max_users,
        current_users: tenant.total_users,
        max_products: tenant.max_products,
        current_products: tenant.total_products,
        max_orders: tenant.max_orders,
        current_orders: tenant.total_orders,
      },
      stats: {
        total_users: tenant.total_users,
        total_products: tenant.total_products,
        total_orders: tenant.total_orders,
        total_deliveries: tenant.total_deliveries,
      },
    };
  }

  /**
   * Get vendor team members
   */
  async getTeamMembers(tenantId: string) {
    return this.usersRepository.find({
      where: { tenant_id: tenantId },
    });
  }

  /**
   * Get delivery performance metrics
   */
  async getDeliveryMetrics(tenantId: string) {
    const [total, completed, pending, failed] = await Promise.all([
      this.deliveriesRepository.count({ where: { tenant_id: tenantId } }),
      this.deliveriesRepository.count({
        where: { tenant_id: tenantId, status: 'delivered' },
      }),
      this.deliveriesRepository.count({
        where: { tenant_id: tenantId, status: 'pending' },
      }),
      this.deliveriesRepository.count({
        where: { tenant_id: tenantId, status: 'failed' },
      }),
    ]);

    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(2) : 0;

    return {
      total_deliveries: total,
      completed: completed,
      pending: pending,
      failed: failed,
      completion_rate: Number(completionRate),
    };
  }

  /**
   * Get rider performance metrics
   */
  async getRiderMetrics(tenantId: string) {
    const riders = await this.ridersRepository.find({
      where: { tenant_id: tenantId, is_active: true },
    });

    const totalRiders = riders.length;
    const availableRiders = riders.filter(
      (r) => r.status === 'available',
    ).length;
    const averageRating =
      totalRiders > 0
        ? (riders.reduce((sum, r) => sum + r.rating, 0) / totalRiders).toFixed(2)
        : 0;
    const averageCompletion =
      totalRiders > 0
        ? (
            riders.reduce((sum, r) => sum + Number(r.completion_rate), 0) /
            totalRiders
          ).toFixed(2)
        : 0;

    return {
      total_riders: totalRiders,
      available_riders: availableRiders,
      average_rating: Number(averageRating),
      average_completion_rate: Number(averageCompletion),
    };
  }
}
