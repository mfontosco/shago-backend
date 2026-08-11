import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from './entities/delivery.entity';
import { Rider } from './entities/rider.entity';
import { DeliveriesService } from './services/deliveries.service';
import { RidersService } from './services/riders.service';
import { DeliveriesController } from './controllers/deliveries.controller';
import { RidersController } from './controllers/riders.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { Order } from '../orders/entities/order.entity';

/**
 * Delivery Module
 *
 * Provides delivery and rider management:
 * - Create/update/delete deliveries
 * - Assign riders to deliveries
 * - Track delivery status and progress
 * - Manage rider information and performance
 * - Get delivery and rider statistics
 *
 * Dependencies:
 * - TypeORM (database)
 * - AuditLogs (audit logging)
 * - Orders (order relationships)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, Rider, Order]),
    AuditLogsModule,
  ],
  controllers: [DeliveriesController, RidersController],
  providers: [DeliveriesService, RidersService],
  exports: [DeliveriesService, RidersService],
})
export class DeliveryModule {}
