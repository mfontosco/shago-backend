import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Delivery } from '../delivery/entities/delivery.entity';
import { Rider } from '../delivery/entities/rider.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entities';

/**
 * Vendor Module
 *
 * Handles vendor-specific operations:
 * - Dashboard endpoints
 * - Business metrics aggregation
 * - Vendor analytics
 *
 * Exports:
 * - DashboardService: Provides dashboard data aggregation
 *
 * Routes:
 * - /api/v1/vendor/dashboard/* : Vendor dashboard metrics
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      Delivery,
      Rider,
      Tenant,
      User,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class VendorModule {}
