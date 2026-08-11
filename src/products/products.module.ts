import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Categeories } from '../categories/entities/categories.entities';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

/**
 * Products Module
 *
 * Provides complete product management:
 * - Create/update/delete products
 * - Manage stock/inventory
 * - Search products
 * - Get product analytics
 * - Archive products
 *
 * Dependencies:
 * - TypeORM (database)
 * - AuditLogs (audit logging)
 * - Categories (product categorization)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Categeories]),
    AuditLogsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
