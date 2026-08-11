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
import { DeliveriesService } from '../services/deliveries.service';
import {
  CreateDeliveryDto,
  UpdateDeliveryDto,
  AssignRiderDto,
  UpdateDeliveryStatusDto,
  QueryDeliveriesDto,
} from '../dtos/create-delivery.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Request as ExpressRequest } from 'express';

/**
 * Deliveries Controller
 *
 * Endpoints for vendor delivery management
 * Vendors track and manage deliveries for orders
 * Multi-tenancy: All deliveries auto-filtered by tenant_id
 *
 * Routes: GET/POST /api/v1/vendor/deliveries
 */
@Controller('vendor/deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  /**
   * GET /api/v1/admin/deliveries
   * List all deliveries with filters and pagination
   *
   * Admin only
   *
   * @query status - Filter by status (pending, assigned, picked_up, etc)
   * @query rider_id - Filter by rider
   * @query order_id - Filter by order
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 20)
   * @query sort_by - Sort field (created_at, status, delivery_time)
   * @query sort_order - Sort order (ASC, DESC)
   *
   * @example
   * curl -H "Authorization: Bearer ADMIN_TOKEN" \
   *   http://localhost:3000/api/v1/admin/deliveries?status=pending&page=1
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findAll(@Query() query: QueryDeliveriesDto) {
    const { data, total } = await this.deliveriesService.findAll(query);

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
   * POST /api/v1/admin/deliveries
   * Create new delivery
   *
   * Admin only
   *
   * @body order_id - Order UUID (required)
   * @body delivery_address - Delivery address (optional)
   * @body recipient_name - Recipient name (optional)
   * @body recipient_phone - Recipient phone (optional)
   * @body estimated_delivery_time - Hours to deliver (0.5-12)
   * @body delivery_fee - Delivery fee amount
   *
   * @example
   * curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
   *   -H "Content-Type: application/json" \
   *   -d '{
   *     "order_id": "uuid",
   *     "delivery_address": "123 Main St",
   *     "recipient_name": "John Doe",
   *     "recipient_phone": "1234567890",
   *     "estimated_delivery_time": 2
   *   }' \
   *   http://localhost:3000/api/v1/admin/deliveries
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDeliveryDto: CreateDeliveryDto,
    @Request() req: ExpressRequest,
  ) {
    const delivery = await this.deliveriesService.create(
      createDeliveryDto,
      req.user?.['id'],
    );

    return {
      statusCode: 201,
      message: 'Delivery created successfully',
      data: delivery,
    };
  }

  /**
   * GET /api/v1/admin/deliveries/:id
   * Get delivery details
   *
   * Admin only
   *
   * @example
   * curl -H "Authorization: Bearer ADMIN_TOKEN" \
   *   http://localhost:3000/api/v1/admin/deliveries/uuid
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const delivery = await this.deliveriesService.findOne(id);

    return {
      statusCode: 200,
      message: 'Success',
      data: delivery,
    };
  }

  /**
   * PATCH /api/v1/admin/deliveries/:id
   * Update delivery details
   *
   * Admin only
   *
   * @body delivery_address - Updated address
   * @body recipient_name - Updated recipient
   * @body recipient_phone - Updated phone
   * @body estimated_delivery_time - Updated ETA
   *
   * @example
   * curl -X PATCH -H "Authorization: Bearer ADMIN_TOKEN" \
   *   -H "Content-Type: application/json" \
   *   -d '{"delivery_address": "456 Oak Ave"}' \
   *   http://localhost:3000/api/v1/admin/deliveries/uuid
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto,
    @Request() req: ExpressRequest,
  ) {
    const delivery = await this.deliveriesService.update(
      id,
      updateDeliveryDto,
      req.user?.['id'],
    );

    return {
      statusCode: 200,
      message: 'Delivery updated successfully',
      data: delivery,
    };
  }

  /**
   * PATCH /api/v1/admin/deliveries/:id/assign-rider
   * Assign rider to delivery
   *
   * Admin only
   *
   * @body rider_id - Rider UUID (required)
   * @body delivery_fee - Optional override for delivery fee
   *
   * @example
   * curl -X PATCH -H "Authorization: Bearer ADMIN_TOKEN" \
   *   -H "Content-Type: application/json" \
   *   -d '{"rider_id": "uuid", "delivery_fee": 50}' \
   *   http://localhost:3000/api/v1/admin/deliveries/uuid/assign-rider
   */
  @Patch(':id/assign-rider')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async assignRider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignRiderDto: AssignRiderDto,
    @Request() req: ExpressRequest,
  ) {
    const delivery = await this.deliveriesService.assignRider(
      id,
      assignRiderDto,
      req.user?.['id'],
    );

    return {
      statusCode: 200,
      message: 'Rider assigned successfully',
      data: delivery,
    };
  }

  /**
   * PATCH /api/v1/admin/deliveries/:id/status
   * Update delivery status
   *
   * Admin only
   *
   * @body status - New status (pending, assigned, picked_up, in_transit, delivered, failed, cancelled)
   * @body rejection_reason - Reason if failed
   * @body delivery_proof_url - Photo URL if delivered
   *
   * @example
   * curl -X PATCH -H "Authorization: Bearer ADMIN_TOKEN" \
   *   -H "Content-Type: application/json" \
   *   -d '{"status": "delivered", "delivery_proof_url": "https://..."}' \
   *   http://localhost:3000/api/v1/admin/deliveries/uuid/status
   */
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateDeliveryStatusDto,
    @Request() req: ExpressRequest,
  ) {
    const delivery = await this.deliveriesService.updateStatus(
      id,
      updateStatusDto,
      req.user?.['id'],
    );

    return {
      statusCode: 200,
      message: 'Delivery status updated successfully',
      data: delivery,
    };
  }

  /**
   * DELETE /api/v1/admin/deliveries/:id
   * Cancel delivery
   *
   * Admin only
   *
   * @example
   * curl -X DELETE -H "Authorization: Bearer ADMIN_TOKEN" \
   *   http://localhost:3000/api/v1/admin/deliveries/uuid
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: ExpressRequest) {
    await this.deliveriesService.cancel(id, req.user?.['id']);

    return {
      statusCode: 204,
      message: 'Delivery cancelled successfully',
    };
  }

  /**
   * GET /api/v1/admin/deliveries/stats/dashboard
   * Get delivery statistics
   *
   * Admin only
   *
   * @example
   * curl -H "Authorization: Bearer ADMIN_TOKEN" \
   *   http://localhost:3000/api/v1/admin/deliveries/stats/dashboard
   */
  @Get('stats/dashboard')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStats() {
    const stats = await this.deliveriesService.getStats();

    return {
      statusCode: 200,
      message: 'Success',
      data: stats,
    };
  }
}
