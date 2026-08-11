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
import { Roles } from '../../common/decorators/roles.decorator';
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
  async findAll(@Query() query: QueryCategoriesDto) {
    const { data, total } = await this.categoriesService.findAll(query);

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
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req: ExpressRequest,
  ) {
    const category = await this.categoriesService.create(
      createCategoryDto,
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
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.categoriesService.findOne(id);

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
  async getCategoryProducts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const result = await this.categoriesService.getCategoryWithProducts(id, page, limit);

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
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req: ExpressRequest,
  ) {
    const category = await this.categoriesService.update(
      id,
      updateCategoryDto,
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
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: ExpressRequest) {
    await this.categoriesService.remove(id, req.user?.['id']);

    return {
      statusCode: 204,
      message: 'Category deleted successfully',
    };
  }
}
