import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsArray,
  MinLength,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Variant data for product
 */
export class ProductVariantDto {
  @IsString()
  @MinLength(1)
  sku: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock_quantity: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  size?: string;
}

/**
 * Create Product DTO
 */
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsString()
  sku: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock_quantity: number;

  @IsUUID()
  category_id: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsArray()
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: string;
}

/**
 * Update Product DTO
 */
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_quantity?: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: string;
}

/**
 * Update Stock DTO
 */
export class UpdateStockDto {
  @IsNumber()
  quantity: number;

  @IsEnum(['add', 'remove', 'set'])
  action: 'add' | 'remove' | 'set';

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Query Products DTO
 */
export class QueryProductsDto {
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search by name or SKU

  @IsOptional()
  @IsString()
  sort_by?: 'name' | 'price' | 'stock' | 'created_at';

  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  min_price?: number;

  @IsOptional()
  @Type(() => Number)
  max_price?: number;

  @IsOptional()
  @Type(() => Boolean)
  low_stock_only?: boolean; // Show only low stock items
}

/**
 * Product Response DTO
 */
export class ProductResponseDto {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock_quantity: number;
  category_id: string;
  category?: {
    id: string;
    name: string;
  };
  image_url?: string;
  status: string;
  variants?: Array<{
    id: string;
    sku: string;
    price: number;
    stock_quantity: number;
    color?: string;
    size?: string;
  }>;
  created_at: Date;
  updated_at: Date;
}
