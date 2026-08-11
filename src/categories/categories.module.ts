import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categeories } from './entities/categories.entities';
import { Product } from '../product/entities/products.entities';
import { CategoriesService } from './services/categories.service';
import { CategoriesController } from './controllers/categories.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

/**
 * Categories Module
 *
 * Provides category management:
 * - Create/update/delete categories
 * - List categories with filtering
 * - Get category with products
 * - Prevent deletion if category has products
 *
 * Dependencies:
 * - TypeORM (database)
 * - AuditLogs (audit logging)
 * - Product (product relationships)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Categeories, Product]),
    AuditLogsModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
