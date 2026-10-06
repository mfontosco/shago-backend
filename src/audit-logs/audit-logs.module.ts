import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLoggerService } from './services/audit-logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLoggerService],
  exports: [AuditLoggerService],
})
export class AuditLogsModule {}
