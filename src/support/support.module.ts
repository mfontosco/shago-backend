import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SupportTicket } from "./entities/support-ticket.entity";
import { Feedback } from "./entities/feedback.entity";
import { SupportService } from "./services/support.service";
import { SupportController } from "./controllers/support.controller";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket, Feedback]),
    AuditLogsModule,
  ],
  providers: [SupportService],
  controllers: [SupportController],
  exports: [SupportService],
})
export class SupportModule {}
