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
import { CategoriesService } from '../services/categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoriesDto,
} from '../dtos/create-category.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Request as ExpressRequest } from 'express';

/**
 * Categories Controller
 *
 * Endpoints for vendor category management
 * Vendors organize their products into categories
 * Multi-tenancy: All categories auto-filtered by tenant_id
 *
 * Routes: GET/POST /api/v1/vendor/categories
 */
@Controller('vendor/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * GET /api/v1/admin/categories
   * List all categories with filtering and pagination
   *
   * Public endpoint
   */
  @Get()
  @UseGuards(TenantGuard)
  async findAll(
    @Query() query: QueryCategoriesDto,
    @CurrentTenant() tenantId: string,
  ) {
    const { data, total } = await this.categoriesService.findAll(query, tenantId);

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
   * POST /api/v1/admin/categories
   * Create a new category
   *
   * Admin only
   */
  @Post()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentTenant() tenantId: string,
    @Request() req: ExpressRequest,
  ) {
    const category = await this.categoriesService.create(
      createCategoryDto,
      tenantId,
      req.user?.['id'],
    );

    return {
      statusCode: 201,
      message: 'Category created successfully',
      data: category,
    };
  }

  /**
   * GET /api/v1/admin/categories/:id
   * Get category details with products
   *
   * Public endpoint
   */
  @Get(':id')
  @UseGuards(TenantGuard)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    const category = await this.categoriesService.findOne(id, tenantId);

    return {
      statusCode: 200,
      message: 'Success',
      data: category,
    };
  }

  /**
   * GET /api/v1/admin/categories/:id/products
   * Get category with its products (paginated)
   *
   * Public endpoint
   */
  @Get(':id/products')
  @UseGuards(TenantGuard)
  async getCategoryProducts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentTenant() tenantId: string,
  ) {
    const result = await this.categoriesService.getCategoryWithProducts(id, tenantId, page, limit);

    return {
      statusCode: 200,
      message: 'Success',
      data: result,
    };
  }

  /**
   * PATCH /api/v1/admin/categories/:id
   * Update category
   *
   * Admin only
   */
  @Patch(':id')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentTenant() tenantId: string,
    @Request() req: ExpressRequest,
  ) {
    const category = await this.categoriesService.update(
      id,
      updateCategoryDto,
      tenantId,
      req.user?.['id'],
    );

    return {
      statusCode: 200,
      message: 'Category updated successfully',
      data: category,
    };
  }

  /**
   * DELETE /api/v1/admin/categories/:id
   * Delete category
   *
   * Admin only
   * Note: Cannot delete if category has products
   */
  @Delete(':id')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Request() req: ExpressRequest,
  ) {
    await this.categoriesService.remove(id, tenantId, req.user?.['id']);

    return {
      statusCode: 204,
      message: 'Category deleted successfully',
    };
  }
}
