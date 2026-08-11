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
import { RidersService } from '../services/riders.service';
import { QueryRidersDto } from '../dtos/create-delivery.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Request as ExpressRequest } from 'express';

/**
 * Riders Controller
 *
 * Endpoints for vendor rider management
 * Vendors manage delivery riders/drivers
 * Multi-tenancy: All riders auto-filtered by tenant_id
 *
 * Routes: GET/POST /api/v1/vendor/riders
 */
@Controller('vendor/riders')
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  /**
   * GET /api/v1/admin/riders
   * List all riders with pagination
   *
   * Admin only
   *
   * @query status - Filter by status (available, unavailable, on_delivery, etc)
   * @query search - Search by name or phone
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 20)
   * @query sort_by - Sort field (created_at, rating, completed_deliveries)
   * @query sort_order - Sort order (ASC, DESC)
   *
   * @example
   * curl -H "Authorization: Bearer ADMIN_TOKEN" \
   *   http://localhost:3000/api/v1/admin/riders?status=available
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findAll(@Query() query: QueryRidersDto) {
    const { data, total } = await this.ridersService.findAll(query);

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
   * POST /api/v1/admin/riders
   * Create new rider
   *
   * Admin only
   *
   * @body name - Rider name (required)
   * @body phone - Rider phone (required, unique)
   * @body email - Email address (optional)
   * @body vehicle_type - Type of vehicle (bike, car, scooter)
   * @body vehicle_plate - License plate number
   *
   * @example
   * curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
   *   -H "Content-Type: application/json" \
   *   -d '{
   *     "name": "Ahmed Hassan",
   *     "phone": "0501234567",
   *     "email": "ahmed@example.com",
   *     "vehicle_type": "bike",
   *     "vehicle_plate": "ABC123"
   *   }' \
   *   http://localhost:3000/api/v1/admin/riders
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body()
    data: {
      name: string;
      phone: string;
      email?: string;
      vehicle_type?: string;
      vehicle_plate?: string;
    },
    @Request() req: ExpressRequest,
  ) {
    const rider = await this.ridersService.create(data, req.user?.['id']);

    return {
      statusCode: 201,
      message: 'Rider created successfully',
      data: rider,
    };
  }

  /**
   * GET /api/v1/admin/riders/available
   * Get available riders for assignment
   *
   * Admin only
   *
   * @example
   * curl -H "Authorization: Bearer ADMIN_TOKEN" \
   *   http://localhost:3000/api/v1/admin/riders/available
   */
  @Get('available')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAvailable() {
    const riders = await this.ridersService.getAvailable();

    return {
      statusCode: 200,
      message: 'Success',
      data: riders,
      count: riders.length,
    };
  }

  /**
   * GET /api/v1/admin/riders/:id
   * Get rider details with performance metrics
   *
   * Admin only
   *
   * @example
   * curl -H "Authorization: Bearer ADMIN_TOKEN" \
   *   http://localhost:3000/api/v1/admin/riders/uuid
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const rider = await this.ridersService.getRiderWithMetrics(id);

    return {
      statusCode: 200,
      message: 'Success',
      data: rider,
    };
  }

  /**
   * PATCH /api/v1/admin/riders/:id
   * Update rider information
   *
   * Admin only
   *
   * @body name - Rider name
   * @body email - Email address
   * @body vehicle_type - Vehicle type
   * @body vehicle_plate - License plate
   * @body notes - Additional notes
   *
   * @example
   * curl -X PATCH -H "Authorization: Bearer ADMIN_TOKEN" \
   *   -H "Content-Type: application/json" \
   *   -d '{"vehicle_plate": "XYZ789"}' \
   *   http://localhost:3000/api/v1/admin/riders/uuid
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    data: {
      name?: string;
      email?: string;
      vehicle_type?: string;
      vehicle_plate?: string;
      notes?: string;
    },
    @Request() req: ExpressRequest,
  ) {
    const rider = await this.ridersService.update(id, data, req.user?.['id']);

    return {
      statusCode: 200,
      message: 'Rider updated successfully',
      data: rider,
    };
  }

  /**
   * PATCH /api/v1/admin/riders/:id/status
   * Update rider status
   *
   * Admin only
   *
   * @body status - Status (available, unavailable, on_delivery, on_break, inactive)
   *
   * @example
   * curl -X PATCH -H "Authorization: Bearer ADMIN_TOKEN" \
   *   -H "Content-Type: application/json" \
   *   -d '{"status": "available"}' \
   *   http://localhost:3000/api/v1/admin/riders/uuid/status
   */
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { status: string },
    @Request() req: ExpressRequest,
  ) {
    const rider = await this.ridersService.updateStatus(
      id,
      data.status as any,
      req.user?.['id'],
    );

    return {
      statusCode: 200,
      message: 'Rider status updated successfully',
      data: rider,
    };
  }

  /**
   * DELETE /api/v1/admin/riders/:id
   * Deactivate rider
   *
   * Admin only
   *
   * @example
   * curl -X DELETE -H "Authorization: Bearer ADMIN_TOKEN" \
   *   http://localhost:3000/api/v1/admin/riders/uuid
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: ExpressRequest) {
    await this.ridersService.remove(id, req.user?.['id']);

    return {
      statusCode: 204,
      message: 'Rider deactivated successfully',
    };
  }

  /**
   * GET /api/v1/admin/riders/stats/dashboard
   * Get riders statistics
   *
   * Admin only
   *
   * @example
   * curl -H "Authorization: Bearer ADMIN_TOKEN" \
   *   http://localhost:3000/api/v1/admin/riders/stats/dashboard
   */
  @Get('stats/dashboard')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStats() {
    const stats = await this.ridersService.getStats();

    return {
      statusCode: 200,
      message: 'Success',
      data: stats,
    };
  }
}
