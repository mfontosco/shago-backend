# Multi-Tenancy Implementation Checklist

**Overall Status:** 🚀 Ready to Implement  
**Complexity:** Medium (affects all modules)  
**Time Required:** 4-6 hours  
**Best Time:** NOW, before generating migrations

---

## 📋 Phase 1: Infrastructure (Core Files)

These files are already created in the backend:

- [x] `src/tenants/entities/tenant.entity.ts` - Tenant model
- [x] `src/tenants/dtos/create-tenant.dto.ts` - Tenant DTOs
- [x] `src/common/middleware/tenant.middleware.ts` - Extract tenant from JWT
- [x] `src/common/guards/tenant.guard.ts` - Validate tenant access
- [x] `src/common/decorators/current-tenant.decorator.ts` - Inject tenant parameter
- [x] `MULTI_TENANCY_ARCHITECTURE.md` - Complete architecture guide
- [x] `MULTI_TENANCY_ENTITY_UPDATES.md` - Step-by-step entity update guide

---

## 🔧 Phase 2: Entity Updates (User Action Required)

**Time: 30 minutes**

**Files to modify:**
- [ ] `src/users/entities/user.entities.ts` - Add `tenant_id` column + relationship
- [ ] `src/orders/entities/order.entity.ts` - Add `tenant_id` column + relationship
- [ ] `src/orders/entities/order-item.entity.ts` - Add `tenant_id` column + relationship
- [ ] `src/product/entities/products.entities.ts` - Add `tenant_id` column + relationship
- [ ] `src/categories/entities/categories.entities.ts` - Add `tenant_id` column + relationship
- [ ] `src/delivery/entities/delivery.entity.ts` - Add `tenant_id` column + relationship
- [ ] `src/delivery/entities/rider.entity.ts` - Add `tenant_id` column + relationship
- [ ] `src/audit-logs/entities/audit-log.entity.ts` - Add `tenant_id` column + relationship

**For each file, add:**
```typescript
import { Tenant } from '../../tenants/entities/tenant.entity';

// In entity class:
@Column('uuid')
tenant_id: string;

@ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'tenant_id' })
tenant: Tenant;

// Add indexes
@Index(['tenant_id'])
@Index(['tenant_id', 'created_at'])
```

**Verification:**
```bash
npm run build
# Should have 0 errors
```

---

## 📝 Phase 3: Service Layer Updates

**Time: 2 hours**

### Orders Service
**File:** `src/orders/services/orders.service.ts`

**Changes needed:**

```diff
  // In create() method:
-  async create(dto: CreateOrderDto, adminId?: string): Promise<Order> {
+  async create(dto: CreateOrderDto, tenantId: string, adminId?: string): Promise<Order> {
    
    // Add tenant validation
+   const user = await this.userRepository.findOne({
+     where: { id: dto.user_id, tenant_id: tenantId }
+   });
+   if (!user) throw new NotFoundException('User not found in this tenant');
    
    // Create order with tenant
    const order = this.orderRepository.create({
      ...dto,
+     tenant_id: tenantId,  // ← Add this
    });
    
    // Audit log includes tenant
    if (adminId) {
      await this.auditLogger.log({
+       tenant_id: tenantId,  // ← Add this
        userId: adminId,
        // ... rest of audit ...
      });
    }
  }

  // In findAll() method:
-  async findAll(query: QueryOrdersDto): Promise<{ data: Order[]; total: number }> {
+  async findAll(query: QueryOrdersDto, tenantId: string): Promise<{ data: Order[]; total: number }> {
    
    let queryBuilder = this.orderRepository
      .createQueryBuilder('order')
+     .where('order.tenant_id = :tenantId', { tenantId })  // ← KEY LINE
      .andWhere(/* other filters */);
  }

  // In findOne() method:
-  async findOne(id: string): Promise<Order> {
+  async findOne(id: string, tenantId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
-     where: { id },
+     where: { id, tenant_id: tenantId },  // ← Add tenant filter
    });
  }

  // In update() method:
-  async update(id: string, dto: UpdateOrderDto, adminId: string): Promise<Order> {
+  async update(id: string, dto: UpdateOrderDto, tenantId: string, adminId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);  // ← Pass tenantId
    // ... update logic ...
    if (changes.length > 0) {
      await this.auditLogger.log({
+       tenant_id: tenantId,  // ← Add this
        // ... rest of audit ...
      });
    }
  }
```

**Repeat pattern for:**
- [ ] `ProductsService` - Add `tenantId` to all methods
- [ ] `CategoriesService` - Add `tenantId` to all methods
- [ ] `DeliveriesService` - Add `tenantId` to all methods
- [ ] `RidersService` - Add `tenantId` to all methods

**Key Pattern:**
```typescript
// Every service method should:
1. Accept tenantId parameter
2. Filter all queries by tenant_id
3. Include tenant_id in audit logs
4. Validate related entities belong to same tenant

// Example query pattern:
const order = await this.orderRepository.findOne({
  where: {
    id: orderId,
    tenant_id: tenantId  // ← ALWAYS ADD THIS
  }
});

if (!order) {
  throw new NotFoundException('Order not found in this tenant');
}
```

---

## 🌐 Phase 4: Controller Layer Updates

**Time: 1.5 hours**

### Orders Controller
**File:** `src/orders/controllers/orders.controller.ts`

**Changes needed:**

```diff
  import { TenantGuard } from '../../common/guards/tenant.guard';
  import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

  @Controller('admin/orders')
  export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get()
-   @UseGuards(RolesGuard)
+   @UseGuards(RolesGuard, TenantGuard)  // ← Add TenantGuard
    @Roles('ADMIN', 'SUPER_ADMIN')
    async findAll(
      @Query() query: QueryOrdersDto,
+     @CurrentTenant() tenantId: string,  // ← Add parameter
      @Request() req: ExpressRequest,
    ) {
      const { data, total } = await this.ordersService.findAll(
        query,
+       tenantId  // ← Pass to service
      );

      return {
        statusCode: 200,
        message: 'Success',
        data,
        pagination: { ... },
      };
    }

    @Post()
-   @UseGuards(RolesGuard)
+   @UseGuards(RolesGuard, TenantGuard)  // ← Add TenantGuard
    @Roles('ADMIN', 'SUPER_ADMIN')
    async create(
      @Body() createOrderDto: CreateOrderDto,
+     @CurrentTenant() tenantId: string,  // ← Add parameter
      @Request() req: ExpressRequest,
    ) {
      const order = await this.ordersService.create(
        createOrderDto,
+       tenantId,  // ← Pass to service
        req.user?.['id'],
      );

      return {
        statusCode: 201,
        message: 'Order created successfully',
        data: order,
      };
    }

    @Get(':id')
-   @UseGuards(RolesGuard)
+   @UseGuards(RolesGuard, TenantGuard)  // ← Add TenantGuard
    @Roles('ADMIN', 'SUPER_ADMIN')
    async findOne(
      @Param('id', ParseUUIDPipe) id: string,
+     @CurrentTenant() tenantId: string,  // ← Add parameter
    ) {
      const order = await this.ordersService.findOne(id, tenantId);  // ← Pass tenantId

      return {
        statusCode: 200,
        message: 'Success',
        data: order,
      };
    }

    @Patch(':id')
-   @UseGuards(RolesGuard)
+   @UseGuards(RolesGuard, TenantGuard)  // ← Add TenantGuard
    @Roles('ADMIN', 'SUPER_ADMIN')
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateOrderDto: UpdateOrderDto,
+     @CurrentTenant() tenantId: string,  // ← Add parameter
      @Request() req: ExpressRequest,
    ) {
      const order = await this.ordersService.update(
        id,
        updateOrderDto,
+       tenantId,  // ← Pass to service
        req.user?.['id'],
      );

      return {
        statusCode: 200,
        message: 'Order updated successfully',
        data: order,
      };
    }

    // ... etc for all other endpoints ...
  }
```

**Repeat pattern for:**
- [ ] `ProductsController` - Add `@UseGuards(RolesGuard, TenantGuard)` and `@CurrentTenant()`
- [ ] `CategoriesController` - Add `@UseGuards(RolesGuard, TenantGuard)` and `@CurrentTenant()`
- [ ] `DeliveriesController` - Add `@UseGuards(RolesGuard, TenantGuard)` and `@CurrentTenant()`
- [ ] `RidersController` - Add `@UseGuards(RolesGuard, TenantGuard)` and `@CurrentTenant()`

**Key Pattern for Controllers:**
```typescript
// Every endpoint should have:
1. @UseGuards(RolesGuard, TenantGuard)
2. @CurrentTenant() tenantId: string parameter
3. Pass tenantId to all service methods

// Example endpoint:
@Get(':id')
@UseGuards(RolesGuard, TenantGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
async findOne(
  @Param('id', ParseUUIDPipe) id: string,
  @CurrentTenant() tenantId: string,  // ← ALWAYS ADD
) {
  const resource = await this.service.findOne(id, tenantId);  // ← ALWAYS PASS
  return { statusCode: 200, data: resource };
}
```

---

## 🔐 Phase 5: App Module Integration

**Time: 15 minutes**

**File:** `src/app.module.ts`

**Changes needed:**

```diff
  import { Module } from '@nestjs/common';
  import { TenantMiddleware } from './common/middleware/tenant.middleware';
+ import { Tenant } from './tenants/entities/tenant.entity';

  @Module({
    imports: [
      // ... existing imports ...
      TypeOrmModule.forRootAsync({
        // ... config ...
-       entities: [User, ..., Order, OrderItem, Delivery, Rider],
+       entities: [User, ..., Order, OrderItem, Delivery, Rider, Tenant],  // ← Add Tenant
        // ...
      }),
      // ... existing modules ...
+     TenantModule,  // ← Add TenantModule (create after phase 5)
    ],
  })
  export class AppModule {
-   configure(consumer: MiddlewareConsumer) {}
+   configure(consumer: MiddlewareConsumer) {
+     consumer.apply(TenantMiddleware).forRoutes('*');  // ← Add middleware to all routes
+   }
  }
```

---

## 🏗️ Phase 6: Create Tenants Module

**Time: 30 minutes**

**Files to create:**

- [ ] `src/tenants/services/tenants.service.ts` - CRUD for tenants
- [ ] `src/tenants/controllers/tenants.controller.ts` - Tenant endpoints
- [ ] `src/tenants/tenants.module.ts` - Module wiring
- [ ] `src/tenants/dtos/create-tenant.dto.ts` - Already created ✅

**Basic TenantService structure:**
```typescript
@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    // Create tenant
  }

  async findAll(): Promise<Tenant[]> {
    // Admin super-only
  }

  async findOne(id: string): Promise<Tenant> {
    // Get tenant by ID
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    // Update tenant
  }

  async remove(id: string): Promise<void> {
    // Soft delete
  }
}
```

**Basic TenantController structure:**
```typescript
@Controller('admin/tenants')
export class TenantsController {
  // Super admin only (SUPER_ADMIN role)
  
  @Get()
  async findAll() { }
  
  @Post()
  async create(@Body() dto: CreateTenantDto) { }
  
  @Get(':id')
  async findOne(@Param('id') id: string) { }
  
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) { }
  
  @Delete(':id')
  async remove(@Param('id') id: string) { }
}
```

---

## 🔄 Phase 7: Update AuditLoggerService

**Time: 15 minutes**

**File:** `src/audit-logs/services/audit-logger.service.ts`

**Changes needed:**

```diff
  async log(logData: {
+   tenant_id: string;  // ← Add parameter
    userId: string;
    resource: string;
    action: string;
    entityId: string;
    description?: string;
    changes?: any[];
  }): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
+     tenant_id: logData.tenant_id,  // ← Include in log
      user_id: logData.userId,
      resource: logData.resource,
      action: logData.action,
      entity_id: logData.entityId,
      description: logData.description,
      changes: logData.changes ? JSON.stringify(logData.changes) : null,
    });

    return this.auditLogRepository.save(auditLog);
  }
```

---

## 🔑 Phase 8: Update JWT Generation

**Time: 20 minutes**

**File:** `src/auth/auth.service.ts`

**Changes needed:**

```diff
  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
+     tenant_id: user.tenant_id,  // ← Add to JWT
      permissions: user.permissions,
    };

    return {
      access_token: this.jwtService.sign(payload),
      // ... rest of response
    };
  }

  async register(dto: RegisterDto) {
    // When creating new user, assign a default tenant or require tenant_id
    // Option 1: Require tenant_id in signup
    const user = new User();
    user.email = dto.email;
+   user.tenant_id = dto.tenant_id;  // ← Require in signup
    // ... etc
    
    // Option 2: Create tenant for single-tenant setup
    // const tenant = await this.tenantService.create();
    // user.tenant_id = tenant.id;
  }
```

---

## 🗄️ Phase 9: Database Migrations

**Time: 5 minutes**

```bash
# 1. Generate migrations
npm run migration:generate -- AddMultiTenancySupport

# 2. Review generated migration
cat src/migrations/[timestamp]-AddMultiTenancySupport.ts

# 3. Ensure migrations include:
# ✓ Create tenants table
# ✓ Add tenant_id to users
# ✓ Add tenant_id to orders
# ✓ Add tenant_id to order_items
# ✓ Add tenant_id to products
# ✓ Add tenant_id to categories
# ✓ Add tenant_id to deliveries
# ✓ Add tenant_id to riders
# ✓ Add tenant_id to audit_logs
# ✓ Create all indexes

# 4. Run migrations
npm run migration:run

# 5. Verify database
npm run migration:show
```

---

## ✅ Phase 10: Testing & Verification

**Time: 1 hour**

- [ ] Compile TypeScript: `npm run build` (0 errors)
- [ ] Start server: `npm run start:dev`
- [ ] Create test tenant
  ```bash
  # Admin creates tenant
  curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "Acme Corp", "currency": "AED"}' \
    http://localhost:3000/api/v1/admin/tenants
  ```
- [ ] Create user in tenant
  ```bash
  # Register user with tenant_id
  curl -X POST -H "Content-Type: application/json" \
    -d '{
      "email": "admin@acme.com",
      "password": "Password123!",
      "tenant_id": "acme-tenant-uuid"
    }' \
    http://localhost:3000/api/v1/auth/register
  ```
- [ ] Verify tenant isolation
  ```bash
  # User 1 from Acme gets token
  TOKEN1=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@acme.com", "password": "Password123!"}' \
    http://localhost:3000/api/v1/auth/login | jq -r '.data.access_token')
  
  # Create order in Acme
  curl -X POST -H "Authorization: Bearer $TOKEN1" \
    -H "Content-Type: application/json" \
    -d '{"user_id": "...", "items": [...]}' \
    http://localhost:3000/api/v1/admin/orders
  
  # User 2 from OtherTenant gets token
  TOKEN2=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@othertenant.com", "password": "Password123!"}' \
    http://localhost:3000/api/v1/auth/login | jq -r '.data.access_token')
  
  # User 2 should NOT see User 1's orders
  curl -H "Authorization: Bearer $TOKEN2" \
    http://localhost:3000/api/v1/admin/orders
  # Should return empty array or only OtherTenant's orders
  ```

---

## 📊 Final Verification Checklist

- [ ] **Database:**
  - [ ] Tenants table exists
  - [ ] All tables have tenant_id column
  - [ ] All tenant_id columns have FK to tenants table
  - [ ] All tenant_id columns have proper indexes

- [ ] **Code:**
  - [ ] All entities import Tenant and have relationship
  - [ ] All services accept tenantId parameter
  - [ ] All services filter queries by tenant_id
  - [ ] All controllers use TenantGuard and @CurrentTenant()
  - [ ] All audit logs include tenant_id
  - [ ] JWT includes tenant_id in payload
  - [ ] TenantMiddleware applied to all routes

- [ ] **Functionality:**
  - [ ] User can log in (get JWT with tenant_id)
  - [ ] TenantGuard validates tenant_id
  - [ ] Queries filtered by tenant_id (no cross-tenant data leaks)
  - [ ] Audit logs record tenant_id
  - [ ] Different tenants don't see each other's data

- [ ] **Tests:**
  - [ ] `npm run build` → 0 errors
  - [ ] `npm run start:dev` → server starts
  - [ ] Create tenant → works
  - [ ] Create user in tenant → works
  - [ ] Login user → JWT includes tenant_id
  - [ ] Access orders → returns only that tenant's orders
  - [ ] Try accessing other tenant's data → forbidden

---

## 🎯 Success Criteria

After completing all 10 phases:

```
✅ Multi-tenancy fully implemented
✅ Complete data isolation between tenants
✅ No data leakage possible
✅ Audit trail tracks tenant actions
✅ New tenants can be provisioned in seconds
✅ Single database serves unlimited customers
✅ Ready for SaaS deployment
✅ Zero performance overhead
```

---

## 📝 Implementation Order Recommendation

**Best approach:**

1. **Start with Phase 2** (Entity Updates) - 30 min
   - User does updates to 8 files

2. **Then Phase 3-4** (Service & Controller Updates) - 3.5 hours
   - User updates 5 services + 5 controllers

3. **Then Phase 5-8** (Infrastructure) - 1.5 hours
   - User updates app.module, auth, creates TenantModule

4. **Then Phase 9** (Database Migrations) - 5 min
   - User runs migrations

5. **Then Phase 10** (Testing) - 1 hour
   - User verifies everything works

**Total time: 4-6 hours**

---

## 🚀 Status Summary

**Ready to implement:** YES ✅
**All infrastructure created:** YES ✅
**Entity update guide provided:** YES ✅
**Service update pattern documented:** YES ✅
**Controller update pattern documented:** YES ✅
**Database migration strategy outlined:** YES ✅

**Next step:** Begin Phase 2 (Entity Updates) 

