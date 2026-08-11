import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantsService } from './services/tenants.service';

/**
 * Tenants Module
 *
 * Handles multi-tenant organization management
 * Provides service for creating, updating, and managing tenants
 *
 * Exports:
 * - TenantsService: For creating vendors and managing tenant lifecycle
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
