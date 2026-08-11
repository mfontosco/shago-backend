import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  AssignRiderDto,
  QueryOrdersDto,
} from '../dtos/create-order.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Request as ExpressRequest } from 'express';

/**
 * Orders Controller
 *
 * Endpoints for vendor order management
 *
 * All endpoints require VENDOR or ADMIN role
 * All operations auto-filtered by tenant_id
 * All mutations are audit logged
 *
 * Routes: GET/POST /api/v1/vendor/orders
 */
@Controller('vendor/orders')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * GET /api/v1/admin/orders
   * List all orders with pagination and filtering
   *
   * Query parameters:
   * - page: number (default: 1)
   * - limit: number (default: 20)
   * - status: string (pending, confirmed, shipped, delivered, cancelled)
   * - user_id: string (filter by user)
   * - from_date: ISO date string
   * - to_date: ISO date string
   * - sort_by: created_at | total_price | status
   * - sort_order: ASC | DESC
   *
   * @example
   * curl http://localhost:3000/api/v1/admin/orders?page=1&limit=20&status=pending
   */
  @Get()
  async findAll(@Query() query: QueryOrdersDto) {
    const { data, total } = await this.ordersService.findAll(query);

    return {
      statusCode: 200,
      message: 'Success',
      data,
      pagination: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        pages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  /**
   * POST /api/v1/admin/orders
   * Create a new order
   *
   * @body CreateOrderDto
   * @returns Created order with all details
   *
   * @example
   * curl -X POST http://localhost:3000/api/v1/admin/orders \
   *   -H "Content-Type: application/json" \
   *   -d '{
   *     "user_id": "uuid",
   *     "items": [
   *       {"product_id": "uuid", "quantity": 2, "unit_price": 99.99}
   *     ],
   *     "delivery_address": "123 Main St",
   *     "delivery_latitude": 40.7128,
   *     "delivery_longitude": -74.0060,
   *     "payment_method": "cash"
   *   }'
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req: ExpressRequest) {
    const order = await this.ordersService.create(
      createOrderDto,
      req.user?.['id'], // Admin ID for audit logging
    );

    return {
      statusCode: 201,
      message: 'Order created successfully',
      data: order,
    };
  }

  /**
   * GET /api/v1/admin/orders/:id
   * Get order details with items
   *
   * @param id Order UUID
   * @returns Full order with items and user details
   *
   * @example
   * curl http://localhost:3000/api/v1/admin/orders/550e8400-e29b-41d4-a716-446655440000
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.ordersService.findOne(id);

    return {
      statusCode: 200,
      message: 'Success',
      data: order,
    };
  }

  /**
   * PATCH /api/v1/admin/orders/:id
   * Update order details (address, special instructions, etc.)
   *
   * @param id Order UUID
   * @body UpdateOrderDto
   * @returns Updated order
   *
   * @example
   * curl -X PATCH http://localhost:3000/api/v1/admin/orders/550e8400-e29b-41d4-a716-446655440000 \
   *   -H "Content-Type: application/json" \
   *   -d '{"delivery_address": "456 Oak Ave"}'
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: ExpressRequest,
  ) {
    const order = await this.ordersService.update(id, updateOrderDto, req.user?.['id']);

    return {
      statusCode: 200,
      message: 'Order updated successfully',
      data: order,
    };
  }

  /**
   * PATCH /api/v1/admin/orders/:id/status
   * Update order status (pending → confirmed → shipped → delivered)
   *
   * @param id Order UUID
   * @body UpdateOrderStatusDto { status: string }
   * @returns Updated order
   *
   * @example
   * curl -X PATCH http://localhost:3000/api/v1/admin/orders/550e8400-e29b-41d4-a716-446655440000/status \
   *   -H "Content-Type: application/json" \
   *   -d '{"status": "confirmed"}'
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @Request() req: ExpressRequest,
  ) {
    const order = await this.ordersService.updateStatus(
      id,
      updateStatusDto,
      req.user?.['id'],
    );

    return {
      statusCode: 200,
      message: `Order status updated to ${updateStatusDto.status}`,
      data: order,
    };
  }

  /**
   * PATCH /api/v1/admin/orders/:id/assign-rider
   * Assign a delivery rider to an order
   *
   * @param id Order UUID
   * @body AssignRiderDto { rider_id: string }
   * @returns Updated order with rider assigned
   *
   * @example
   * curl -X PATCH http://localhost:3000/api/v1/admin/orders/550e8400-e29b-41d4-a716-446655440000/assign-rider \
   *   -H "Content-Type: application/json" \
   *   -d '{"rider_id": "uuid", "estimated_delivery_time": 45}'
   */
  @Patch(':id/assign-rider')
  async assignRider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignRiderDto: AssignRiderDto,
    @Request() req: ExpressRequest,
  ) {
    const order = await this.ordersService.assignRider(id, assignRiderDto, req.user?.['id']);

    return {
      statusCode: 200,
      message: 'Rider assigned successfully',
      data: order,
    };
  }

  /**
   * DELETE /api/v1/admin/orders/:id
   * Soft delete (cancel) an order
   *
   * @param id Order UUID
   * @returns Success message
   *
   * @example
   * curl -X DELETE http://localhost:3000/api/v1/admin/orders/550e8400-e29b-41d4-a716-446655440000
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: ExpressRequest) {
    await this.ordersService.remove(id, req.user?.['id']);

    return {
      statusCode: 204,
      message: 'Order deleted successfully',
    };
  }

  /**
   * GET /api/v1/admin/orders/stats/dashboard
   * Get dashboard statistics for orders
   *
   * @returns Order stats (total, pending, revenue, etc.)
   *
   * @example
   * curl http://localhost:3000/api/v1/admin/orders/stats/dashboard
   */
  @Get('stats/dashboard')
  async getDashboardStats() {
    const stats = await this.ordersService.getDashboardStats();

    return {
      statusCode: 200,
      message: 'Success',
      data: stats,
    };
  }

  /**
   * GET /api/v1/admin/orders/stats/today
   * Get today's sales total
   *
   * @returns Today's revenue
   *
   * @example
   * curl http://localhost:3000/api/v1/admin/orders/stats/today
   */
  @Get('stats/today')
  async getTodaysSales() {
    const total = await this.ordersService.getTodaysSales();

    return {
      statusCode: 200,
      message: 'Success',
      data: {
        date: new Date().toISOString().split('T')[0],
        total_sales: total,
      },
    };
  }
}
