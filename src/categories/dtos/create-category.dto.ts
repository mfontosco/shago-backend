import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Create Category DTO
 */
export class CreateCategoryDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}

/**
 * Update Category DTO
 */
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}

/**
 * Query Categories DTO
 */
export class QueryCategoriesDto {
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort_by?: 'name' | 'created_at';

  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Category Response DTO
 */
export class CategoryResponseDto {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  product_count?: number;
  created_at: Date;
  updated_at: Date;
}
