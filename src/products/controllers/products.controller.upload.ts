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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from '../services/products.service';
import { CloudinaryService } from '../../common/services/cloudinary.service';
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
 * Products Controller (with Cloudinary Image Uploads)
 *
 * Endpoints for product management with image uploads
 * Images are uploaded to Cloudinary, not stored locally
 *
 * Configuration required:
 * CLOUDINARY_CLOUD_NAME=xxx
 * CLOUDINARY_API_KEY=xxx
 * CLOUDINARY_API_SECRET=xxx
 */
@Controller('admin/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
   * Create a new product with optional image upload
   *
   * Admin only
   *
   * @body {
   *   name: string,
   *   sku: string,
   *   description: string,
   *   price: number,
   *   stock: number,
   *   category_id: UUID,
   *   status: 'active' | 'inactive'
   * }
   *
   * @file image (optional, multipart/form-data)
   *
   * Example with image:
   * curl -X POST -H "Authorization: Bearer $TOKEN" \
   *   -F "name=Dell Laptop" \
   *   -F "sku=DELL-001" \
   *   -F "description=High-performance laptop" \
   *   -F "price=1200" \
   *   -F "stock=50" \
   *   -F "category_id=cat-uuid" \
   *   -F "status=active" \
   *   -F "image=@/path/to/image.jpg" \
   *   http://localhost:3000/api/v1/admin/products
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: ExpressRequest,
  ) {
    let imageUrl: string | undefined;

    // Upload image to Cloudinary if provided
    if (file) {
      try {
        this.cloudinaryService.validateFile(file);
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'products',
        );
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        throw new BadRequestException(`Image upload failed: ${error.message}`);
      }
    }

    // Create product with image URL
    const product = await this.productsService.create(
      {
        ...createProductDto,
        image_url: imageUrl || createProductDto.image_url,
      },
      req.user?.['id'],
    );

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
   * Update product details with optional image upload
   *
   * Admin only
   *
   * Example with new image:
   * curl -X PATCH -H "Authorization: Bearer $TOKEN" \
   *   -F "name=Updated Laptop" \
   *   -F "price=1100" \
   *   -F "image=@/path/to/new-image.jpg" \
   *   http://localhost:3000/api/v1/admin/products/product-uuid
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: ExpressRequest,
  ) {
    let imageUrl: string | undefined;

    // Upload new image if provided
    if (file) {
      try {
        this.cloudinaryService.validateFile(file);
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'products',
        );
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        throw new BadRequestException(`Image upload failed: ${error.message}`);
      }
    }

    // Update product
    const product = await this.productsService.update(
      id,
      {
        ...updateProductDto,
        image_url: imageUrl || updateProductDto.image_url,
      },
      req.user?.['id'],
    );

    return {
      statusCode: 200,
      message: 'Product updated successfully',
      data: product,
    };
  }

  /**
   * PATCH /api/v1/admin/products/:id/image
   * Update product image only
   *
   * Admin only
   * Dedicated endpoint for image-only updates
   *
   * Example:
   * curl -X PATCH -H "Authorization: Bearer $TOKEN" \
   *   -F "image=@/path/to/image.jpg" \
   *   http://localhost:3000/api/v1/admin/products/product-uuid/image
   */
  @Patch(':id/image')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  async updateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: ExpressRequest,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    try {
      this.cloudinaryService.validateFile(file);
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'products',
      );

      // Update product with new image URL
      const product = await this.productsService.update(
        id,
        { image_url: uploadResult.secure_url },
        req.user?.['id'],
      );

      return {
        statusCode: 200,
        message: 'Product image updated successfully',
        data: product,
      };
    } catch (error) {
      throw new BadRequestException(`Image upload failed: ${error.message}`);
    }
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
