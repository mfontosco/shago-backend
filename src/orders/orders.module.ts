import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './services/orders.service';
import { OrdersController } from './controllers/orders.controller';
import { Product } from '../product/entities/products.entities';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

/**
 * Orders Module
 *
 * Provides complete order management functionality:
 * - Create orders
 * - List/query orders
 * - Update order details
 * - Change order status
 * - Assign delivery riders
 * - Dashboard statistics
 *
 * Dependencies:
 * - TypeORM (database)
 * - AuditLogs (audit logging)
 * - Product (product information)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product]),
    AuditLogsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // Export so other modules can use it
})
export class OrdersModule {}
