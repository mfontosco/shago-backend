import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { SeedService } from './seeds/seed.service';

/**
 * Common Module - Shared utilities, filters, guards, decorators
 *
 * Exports:
 * - Global exception filter (registered in main.ts)
 * - RolesGuard (use in controllers)
 * - @Roles() decorator (mark protected endpoints)
 * - SeedService (initialize database)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  providers: [SeedService],
  exports: [SeedService],
})
export class CommonModule {}
