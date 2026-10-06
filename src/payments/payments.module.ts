import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { Payment } from "./entities/payment.entity";
import { PaymentsService } from "./services/payments.service";
import { PaymentGatewayService } from "./services/payment-gateway.service";
import { PaymentsController } from "./controllers/payments.controller";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    HttpModule,
    AuditLogsModule,
  ],
  providers: [PaymentsService, PaymentGatewayService],
  controllers: [PaymentsController],
  exports: [PaymentsService, PaymentGatewayService],
})
export class PaymentsModule {}
