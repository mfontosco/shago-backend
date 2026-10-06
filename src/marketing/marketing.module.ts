import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Promotion } from "./entities/promotion.entity";
import { MarketingService } from "./services/marketing.service";
import { MarketingController } from "./controllers/marketing.controller";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Promotion]),
    AuditLogsModule,
  ],
  providers: [MarketingService],
  controllers: [MarketingController],
  exports: [MarketingService],
})
export class MarketingModule {}
