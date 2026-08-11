import { IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';

/**
 * Vendor Registration DTO
 *
 * Used when a new vendor/organization signs up
 * Creates both:
 * 1. Tenant (organization)
 * 2. User (admin user for that tenant)
 *
 * Example:
 * {
 *   "business_name": "Acme Corp",
 *   "email": "admin@acme.com",
 *   "password": "secure_password_123",
 *   "country": "AE",
 *   "currency": "AED"
 * }
 */
export class VendorRegisterDto {
  /**
   * Business/Tenant name
   * Will become the tenant.name and auto-generate slug
   */
  @IsString()
  business_name: string;

  /**
   * Admin user email
   * Must be unique across platform
   */
  @IsEmail()
  email: string;

  /**
   * Admin user password
   * Minimum 8 characters
   */
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  /**
   * Country (optional)
   * Two-letter country code: AE, US, UK, etc.
   */
  @IsString()
  @IsOptional()
  country?: string;

  /**
   * Currency (optional)
   * Default: AED
   */
  @IsString()
  @IsOptional()
  currency?: string;

  /**
   * Admin first name (optional)
   */
  @IsString()
  @IsOptional()
  first_name?: string;

  /**
   * Admin last name (optional)
   */
  @IsString()
  @IsOptional()
  last_name?: string;

  /**
   * Phone number (optional)
   */
  @IsString()
  @IsOptional()
  phone?: string;
}

/**
 * Vendor Registration Response
 */
export class VendorRegisterResponseDto {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: string;
    tenant_id: string;
    created_at: Date;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    status: string;
    plan: string;
  };
  access_token: string;
  message: string;
}
