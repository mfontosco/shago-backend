# Phase 2 - Quick Start Implementation Guide

**Status:** 🚧 Starting Phase 2  
**Date:** August 10, 2026

---

## ✅ What's Been Created

### Audit Logging System
- ✅ AuditLog Entity (`src/audit-logs/entities/audit-log.entity.ts`)
  - Tracks all admin actions
  - Records changes, IP, user-agent
  - Indexed for performance
  - 13 columns for comprehensive logging

- ✅ AuditLoggerService (`src/audit-logs/services/audit-logger.service.ts`)
  - Central logging service
  - Query/filter audit logs
  - Export functionality
  - Statistics & retention

---

## 🚀 Next Steps (Today - Days 1-2)

### Step 1: Create Audit Log DTOs

Create file: `src/audit-logs/dtos/query-audit-log.dto.ts`

```typescript
import { IsOptional, IsString, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAuditLogDto {
  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AuditLogResponseDto {
  id: string;
  admin_user_id: string;
  resource: string;
  action: string;
  entity_id: string;
  changes?: Array<{
    field: string;
    old_value: any;
    new_value: any;
  }>;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}
```

### Step 2: Create Audit Log Controller

Create file: `src/audit-logs/controllers/audit-logs.controller.ts`

```typescript
import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuditLoggerService } from '../services/audit-logger.service';
import { QueryAuditLogDto } from '../dtos/query-audit-log.dto.ts';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/audit-logs')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AuditLogsController {
  constructor(private readonly auditLogger: AuditLoggerService) {}

  @Get()
  async findLogs(@Query() query: QueryAuditLogDto) {
    const { data, total, pages } = await this.auditLogger.findLogs({
      resource: query.resource,
      action: query.action,
      userId: query.user_id,
      dateFrom: query.date_from ? new Date(query.date_from) : undefined,
      dateTo: query.date_to ? new Date(query.date_to) : undefined,
      page: query.page,
      limit: query.limit,
    });

    return {
      statusCode: 200,
      message: 'Success',
      data,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages,
      },
    };
  }

  @Get('statistics')
  async getStatistics() {
    const stats = await this.auditLogger.getStatistics();
    return {
      statusCode: 200,
      message: 'Success',
      data: stats,
    };
  }

  @Get('export')
  async exportLogs(@Query() query: QueryAuditLogDto, @Res() response: Response) {
    const logs = await this.auditLogger.export({
      resource: query.resource,
      action: query.action,
      userId: query.user_id,
      dateFrom: query.date_from ? new Date(query.date_from) : undefined,
      dateTo: query.date_to ? new Date(query.date_to) : undefined,
    });

    const csv = this.logsToCSV(logs);
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename=audit-logs-${new Date().toISOString()}.csv`,
    );
    response.send(csv);
  }

  private logsToCSV(logs: any[]): string {
    const headers = ['ID', 'User', 'Resource', 'Action', 'Entity ID', 'Changes', 'IP Address', 'Timestamp'];
    const rows = logs.map(log => [
      log.id,
      log.admin_user?.email || 'Unknown',
      log.resource,
      log.action,
      log.entity_id,
      JSON.stringify(log.changes || []),
      log.ip_address,
      log.created_at,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csv;
  }
}
```

### Step 3: Create Audit Log Module

Create file: `src/audit-logs/audit-logs.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLoggerService } from './services/audit-logger.service';
import { AuditLogsController } from './controllers/audit-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogsController],
  providers: [AuditLoggerService],
  exports: [AuditLoggerService],  // Export so other modules can inject it
})
export class AuditLogsModule {}
```

### Step 4: Create Database Migration

```bash
npm run migration:generate -- CreateAuditLogsTable
```

Review the migration and adjust if needed.

### Step 5: Update App Module

Edit `src/app.module.ts`:

```typescript
// Add import
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuditLog } from './audit-logs/entities/audit-log.entity';

// In TypeOrmModule.forRootAsync, add to entities array:
entities: [
  // ... existing entities
  AuditLog,
],

// In imports array, add:
AuditLogsModule,
```

### Step 6: Run Migration & Tests

```bash
# Run migration
npm run migration:run

# Run tests
npm run test
```

---

## 📊 Testing Audit Logs

### Manual Test with cURL

```bash
# 1. Get audit logs
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/v1/admin/audit-logs

# 2. Get statistics
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/v1/admin/audit-logs/statistics

# 3. Filter by resource
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/v1/admin/audit-logs?resource=products&action=update"

# 4. Export as CSV
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/v1/admin/audit-logs/export" \
  > audit-logs.csv
```

---

## 🔄 Using Audit Logger in Services

### In Any Service:

```typescript
import { Injectable } from '@nestjs/common';
import { AuditLoggerService } from './audit-logs/services/audit-logger.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly auditLogger: AuditLoggerService,
    // ... other dependencies
  ) {}

  async updateProduct(id: string, dto: UpdateProductDto, user: User, request: Request) {
    const oldProduct = await this.getProduct(id);
    const updatedProduct = await this.repo.save({ ...oldProduct, ...dto });

    // Track changes
    const changes = [];
    if (oldProduct.price !== dto.price) {
      changes.push({
        field: 'price',
        old_value: oldProduct.price,
        new_value: dto.price,
      });
    }

    // Log the action
    await this.auditLogger.log({
      userId: user.id,
      resource: 'products',
      action: 'update',
      entityId: id,
      changes,
      description: `Product updated by ${user.email}`,
      httpMethod: request.method,
      endpoint: request.path,
    }, request);

    return updatedProduct;
  }
}
```

---

## 🎯 Week 1 Daily Checklist

### Day 1
- [ ] Create Audit Log DTOs
- [ ] Create Audit Log Controller
- [ ] Create Audit Log Module
- [ ] Generate & run migration
- [ ] Test endpoints with cURL

### Day 2
- [ ] Write unit tests for AuditLoggerService
- [ ] Write controller tests for AuditLogsController
- [ ] Write E2E tests
- [ ] Reach >80% test coverage
- [ ] Document audit logging guide

### Day 3-4: Admin Users Service & Controller
- [ ] Create AdminUsersService
- [ ] Create AdminUsersController
- [ ] Create DTOs
- [ ] Write tests
- [ ] Create migration for admin_users table

### Day 5: Integration
- [ ] Connect all modules
- [ ] Update AppModule
- [ ] Run all tests
- [ ] Fix any issues

---

## 🔒 Security Checklist

- [ ] @Roles('ADMIN', 'SUPER_ADMIN') on all endpoints
- [ ] Input validation on all DTOs
- [ ] Audit logs cannot be deleted (only queried)
- [ ] Sensitive data excluded from exports
- [ ] Error messages don't leak info
- [ ] Rate limiting ready for Phase 2

---

## 📈 Expected Outcomes (Day 2 EOD)

✅ Audit logging fully operational  
✅ Endpoints tested and working  
✅ 80%+ test coverage  
✅ Documentation complete  
✅ Ready for Admin Users implementation

---

## 🆘 Troubleshooting

### Issue: Migration fails
```bash
# Revert and try again
npm run migration:revert
npm run migration:generate -- CreateAuditLogsTable
# Review migration file
npm run migration:run
```

### Issue: Service not injected
```typescript
// Make sure AuditLogsModule exports the service
exports: [AuditLoggerService],

// And other modules import AuditLogsModule
imports: [AuditLogsModule],
```

### Issue: Tests failing
```bash
# Clear Jest cache and re-run
npm run test -- --clearCache
npm run test
```

---

## 📚 Reference

- **Phase 2 Plan:** PHASE_2_PLAN.md
- **System Design:** SYSTEM_DESIGN.md
- **Developer Checklist:** DEVELOPER_CHECKLIST.md
- **NestJS Docs:** https://docs.nestjs.com

---

## ✨ Next After Day 2

Once audit logging is complete:
1. Admin Users Management (Days 3-4)
2. Role Management (Days 5-6)
3. Feature Flags (Days 7-8)
4. System Configuration (Days 9-10)

---

**Ready to implement? Let's go!** 🚀

Follow the steps above and you'll have a professional audit logging system by end of Day 2.

Questions? Check the documentation or existing examples in codebase.
