import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * Vendor Dashboard Controller
 *
 * Provides aggregated business metrics for vendor dashboard
 * All endpoints return data filtered by vendor's tenant_id
 *
 * Routes: /api/v1/vendor/dashboard/*
 */
@Controller('vendor/dashboard')
@UseGuards(TenantGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/v1/vendor/dashboard/summary
   * Get KPI summary cards
   *
   * Returns:
   * - Total orders count
   * - Today's orders
   * - Total revenue
   * - Average order value
   * - Active products count
   * - Pending deliveries
   *
   * @returns { total_orders, todays_orders, total_revenue, ... }
   */
  @Get('summary')
  async getSummary(@CurrentTenant() tenantId: string) {
    const summary = await this.dashboardService.getSummary(tenantId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Dashboard summary retrieved',
      data: summary,
    };
  }

  /**
   * GET /api/v1/vendor/dashboard/sales-trend
   * Get sales trend data for area chart
   *
   * Query parameters:
   * - days: number of days to retrieve (default: 30)
   *
   * Returns array of daily sales data:
   * [{ date, revenue, orders }]
   */
  @Get('sales-trend')
  async getSalesTrend(
    @Query('days') days: string = '30',
    @CurrentTenant() tenantId: string,
  ) {
    const trend = await this.dashboardService.getSalesTrend(
      tenantId,
      parseInt(days),
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Sales trend data retrieved',
      data: trend,
      chart_type: 'area',
    };
  }

  /**
   * GET /api/v1/vendor/dashboard/product-breakdown
   * Get product sales breakdown for pie chart
   *
   * Returns array of categories with sales data:
   * [{ category, count, quantity, revenue }]
   */
  @Get('product-breakdown')
  async getProductBreakdown(@CurrentTenant() tenantId: string) {
    const breakdown = await this.dashboardService.getProductBreakdown(
      tenantId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Product breakdown retrieved',
      data: breakdown,
      chart_type: 'pie',
    };
  }

  /**
   * GET /api/v1/vendor/dashboard/low-stock
   * Get low stock alert products for table
   *
   * Query parameters:
   * - threshold: stock threshold level (default: 10)
   *
   * Returns array of products below threshold
   */
  @Get('low-stock')
  async getLowStockAlerts(
    @Query('threshold') threshold: string = '10',
    @CurrentTenant() tenantId: string,
  ) {
    const alerts = await this.dashboardService.getLowStockAlerts(
      tenantId,
      parseInt(threshold),
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Low stock alerts retrieved',
      data: alerts,
      count: alerts.length,
    };
  }

  /**
   * GET /api/v1/vendor/dashboard/top-selling
   * Get top selling products for table
   *
   * Query parameters:
   * - limit: number of products (default: 10)
   * - sortBy: 'revenue' | 'quantity' (default: 'revenue')
   *
   * Returns array of top selling products
   */
  @Get('top-selling')
  async getTopSellingProducts(
    @Query('limit') limit: string = '10',
    @Query('sortBy') sortBy: 'revenue' | 'quantity' = 'revenue',
    @CurrentTenant() tenantId: string,
  ) {
    const products = await this.dashboardService.getTopSellingProducts(
      tenantId,
      parseInt(limit),
      sortBy,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Top selling products retrieved',
      data: products,
      count: products.length,
    };
  }

  /**
   * GET /api/v1/vendor/dashboard/tenant-info
   * Get vendor/tenant information
   *
   * Returns:
   * - Tenant details (name, plan, status)
   * - Trial status and days remaining
   * - Quota usage
   * - Statistics
   */
  @Get('tenant-info')
  async getTenantInfo(@CurrentTenant() tenantId: string) {
    const info = await this.dashboardService.getTenantInfo(tenantId);

    if (!info) {
      return {
        statusCode: 404,
        message: 'Tenant not found',
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Tenant information retrieved',
      data: info,
    };
  }

  /**
   * GET /api/v1/vendor/dashboard/team
   * Get vendor team members
   *
   * Returns array of team members with roles
   */
  @Get('team')
  async getTeamMembers(@CurrentTenant() tenantId: string) {
    const members = await this.dashboardService.getTeamMembers(tenantId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Team members retrieved',
      data: members,
      count: members.length,
    };
  }

  /**
   * GET /api/v1/vendor/dashboard/delivery-metrics
   * Get delivery performance metrics
   *
   * Returns:
   * - Total deliveries
   * - Completed/pending/failed counts
   * - Completion rate percentage
   */
  @Get('delivery-metrics')
  async getDeliveryMetrics(@CurrentTenant() tenantId: string) {
    const metrics = await this.dashboardService.getDeliveryMetrics(tenantId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Delivery metrics retrieved',
      data: metrics,
    };
  }

  /**
   * GET /api/v1/vendor/dashboard/rider-metrics
   * Get rider performance metrics
   *
   * Returns:
   * - Total riders
   * - Available riders
   * - Average rating
   * - Average completion rate
   */
  @Get('rider-metrics')
  async getRiderMetrics(@CurrentTenant() tenantId: string) {
    const metrics = await this.dashboardService.getRiderMetrics(tenantId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Rider metrics retrieved',
      data: metrics,
    };
  }
}
