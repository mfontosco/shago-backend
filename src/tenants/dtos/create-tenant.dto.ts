import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';

/**
 * Create Tenant DTO
 * Used when creating a new tenant/organization
 */
export class CreateTenantDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(['starter', 'pro', 'enterprise'])
  @IsOptional()
  plan?: string;
}

/**
 * Update Tenant DTO
 */
export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(['trial', 'active', 'suspended', 'inactive'])
  @IsOptional()
  status?: string;

  @IsEnum(['starter', 'pro', 'enterprise'])
  @IsOptional()
  plan?: string;
}

/**
 * Tenant Response DTO
 */
export class TenantResponseDto {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  website: string;
  currency: string;
  status: string;
  plan: string;
  total_users: number;
  total_products: number;
  total_orders: number;
  total_deliveries: number;
  created_at: Date;
}
