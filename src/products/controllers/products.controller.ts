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
import { ProductsService } from '../services/products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateStockDto,
  QueryProductsDto,
} from '../dtos/create-product.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Request as ExpressRequest } from 'express';

/**
 * Products Controller
 *
 * Endpoints for vendor product management
 * Vendors can only manage their own products
 * Multi-tenancy: All operations auto-filtered by tenant_id
 *
 * Routes: GET/POST /api/v1/vendor/products
 */
@Controller('vendor/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /api/v1/admin/products
   * List all products with filtering and pagination
   *
   * Public endpoint (read-only)
   */
  @Get()
  async findAll(@Query() query: QueryProductsDto) {
    const { data, total } = await this.productsService.findAll(query);

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
   * GET /api/v1/admin/products/search/:query
   * Search products by name, SKU, or description
   *
   * Public endpoint
   */
  @Get('search/:query')
  async search(@Param('query') query: string) {
    const products = await this.productsService.search(query);

    return {
      statusCode: 200,
      message: 'Success',
      data: products,
    };
  }

  /**
   * GET /api/v1/admin/products/low-stock
   * Get products with low stock
   *
   * Admin only
   */
  @Get('low-stock')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getLowStock() {
    const products = await this.productsService.getLowStockAlerts();

    return {
      statusCode: 200,
      message: 'Success',
      data: products,
    };
  }

  /**
   * POST /api/v1/admin/products
   * Create a new product
   *
   * Admin only
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto, @Request() req: ExpressRequest) {
    const product = await this.productsService.create(createProductDto, req.user?.['id']);

    return {
      statusCode: 201,
      message: 'Product created successfully',
      data: product,
    };
  }

  /**
   * GET /api/v1/admin/products/:id
   * Get product details
   *
   * Public endpoint
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.productsService.findOne(id);

    return {
      statusCode: 200,
      message: 'Success',
      data: product,
    };
  }

  /**
   * PATCH /api/v1/admin/products/:id
   * Update product details
   *
   * Admin only
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: ExpressRequest,
  ) {
    const product = await this.productsService.update(
      id,
      updateProductDto,
      req.user?.['id'],
    );

    return {
      statusCode: 200,
      message: 'Product updated successfully',
      data: product,
    };
  }

  /**
   * PATCH /api/v1/admin/products/:id/stock
   * Update product stock
   *
   * Admin only
   */
  @Patch(':id/stock')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStockDto: UpdateStockDto,
    @Request() req: ExpressRequest,
  ) {
    const product = await this.productsService.updateStock(
      id,
      updateStockDto,
      req.user?.['id'],
    );

    return {
      statusCode: 200,
      message: 'Stock updated successfully',
      data: product,
    };
  }

  /**
   * PATCH /api/v1/admin/products/:id/archive
   * Archive a product
   *
   * Admin only
   */
  @Patch(':id/archive')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async archive(@Param('id', ParseUUIDPipe) id: string, @Request() req: ExpressRequest) {
    const product = await this.productsService.archive(id, req.user?.['id']);

    return {
      statusCode: 200,
      message: 'Product archived successfully',
      data: product,
    };
  }

  /**
   * DELETE /api/v1/admin/products/:id
   * Delete (soft delete) a product
   *
   * Admin only
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: ExpressRequest) {
    await this.productsService.remove(id, req.user?.['id']);

    return {
      statusCode: 204,
      message: 'Product deleted successfully',
    };
  }

  /**
   * GET /api/v1/admin/products/stats/count
   * Get total product count
   *
   * Admin only
   */
  @Get('stats/count')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getCount() {
    const count = await this.productsService.getCount();

    return {
      statusCode: 200,
      message: 'Success',
      data: { total_products: count },
    };
  }

  /**
   * GET /api/v1/admin/products/stats/inventory-value
   * Get total inventory value
   *
   * Admin only
   */
  @Get('stats/inventory-value')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getInventoryValue() {
    const value = await this.productsService.getInventoryValue();

    return {
      statusCode: 200,
      message: 'Success',
      data: { total_inventory_value: Number(value.toFixed(2)) },
    };
  }
}
