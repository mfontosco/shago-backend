# Multi-Tenancy Architecture for Shago Platform

**Status:** Planning Phase  
**Approach:** Row-Level Tenant Isolation (Cost-Effective, Scalable)  
**Implementation Timeline:** Before Migration Generation  
**Impact:** All 7 entities + All services

---

## 🎯 Multi-Tenancy Strategy

### Chosen Approach: Row-Level Tenant Isolation

**Why this approach?**
```
✅ Cost-effective (single database, multiple tenants)
✅ Easy backup/restore (single database)
✅ Scalable (horizontal scaling via tenant_id indexing)
✅ Simple data migration (no schema duplication)
✅ GDPR compliant (data isolation at application level)

vs. Schema-per-Tenant (complex, expensive)
vs. Database-per-Tenant (very expensive, hard to manage)
```

---

## 📐 Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    HTTP Request                       │
│              (with Authorization header)              │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│          Tenant Extraction Middleware                 │
│  (Extract tenant_id from JWT token payload)           │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│          Tenant Guard (Validation)                    │
│  (Verify user belongs to requested tenant)            │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│        Service Layer (Auto-filter by tenant)          │
│  (All queries: WHERE tenant_id = currentTenant)       │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│           Database (Row-Level Isolation)              │
│  (Single schema, tenant_id on every relevant table)   │
└──────────────────────────────────────────────────────┘
```

---

## 🏗️ Implementation Plan

### Phase 1: Core Multi-Tenancy (Before Migration)

#### 1. Create Tenant Entity
```typescript
// src/tenants/entities/tenant.entity.ts

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255, unique: true })
  name: string;

  @Column('varchar', { length: 255, nullable: true })
  slug: string; // For URL: app.shago.com/acme

  @Column('text', { nullable: true })
  description: string;

  @Column('varchar', { length: 255, nullable: true })
  logo_url: string;

  @Column('enum', {
    enum: ['trial', 'active', 'suspended', 'inactive'],
    default: 'trial'
  })
  status: string;

  @Column('timestamp', { nullable: true })
  subscription_expires_at: Date;

  @Column('varchar', { length: 50, nullable: true })
  plan: string; // 'starter', 'pro', 'enterprise'

  @Column('integer', { default: 0 })
  max_users: number;

  @Column('integer', { default: 0 })
  max_products: number;

  @Column('integer', { default: 0 })
  max_orders: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => Order, order => order.tenant)
  orders: Order[];

  @OneToMany(() => Product, product => product.tenant)
  products: Product[];

  // ... etc for all entities
}
```

#### 2. Update User Entity
```typescript
// Add to existing src/users/entities/user.entities.ts

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ... existing fields ...

  @Column('uuid')
  tenant_id: string;  // ← NEW: Which tenant does this user belong to?

  @ManyToOne(() => Tenant, tenant => tenant.users, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ... rest of entity ...
}
```

#### 3. Update All Domain Entities
Add to: Order, OrderItem, Product, Category, Delivery, Rider

```typescript
// Example for Order entity:

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← NEW

  @Column('uuid')
  user_id: string;

  @Column('enum', {
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'completed'],
    default: 'pending'
  })
  status: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total_price: number;

  // ... rest of fields ...

  @ManyToOne(() => Tenant, tenant => tenant.orders, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ... relationships ...
}

// Apply same pattern to:
// - OrderItem
// - Product
// - Category (if needed)
// - Delivery
// - Rider
// - Payment (Day 8)
// - Settings (Day 10)
```

#### 4. Database Indexes
```typescript
// Add to each entity that has tenant_id:

@Entity('orders')
@Index(['tenant_id'])  // Fast tenant filtering
@Index(['tenant_id', 'created_at'])  // Common query pattern
@Index(['tenant_id', 'status'])  // Status filtering per tenant
export class Order {
  // ...
}
```

---

## 🔐 Tenant Isolation Middleware & Guards

### 1. Tenant Extraction Middleware
```typescript
// src/common/middleware/tenant.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token) {
        const decoded = this.jwtService.verify(token);
        
        // Attach to request object
        req.user = {
          ...decoded,
          tenant_id: decoded.tenant_id,  // ← From JWT payload
        };
      }

      next();
    } catch (error) {
      next();
    }
  }
}
```

### 2. Tenant Guard
```typescript
// src/common/guards/tenant.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenant_id) {
      throw new ForbiddenException('Tenant information not found');
    }

    // Optional: Verify tenant_id from URL matches user's tenant
    const urlTenantId = request.params.tenant_id;
    if (urlTenantId && urlTenantId !== user.tenant_id) {
      throw new ForbiddenException('Unauthorized tenant access');
    }

    // Attach to request for use in services
    request.tenant_id = user.tenant_id;

    return true;
  }
}
```

### 3. Tenant Decorator
```typescript
// src/common/decorators/tenant.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenant_id || request.tenant_id;
  }
);
```

---

## 🔄 Service Layer Changes

### Updated Service Pattern

```typescript
// Example: OrdersService with multi-tenancy

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private auditLogger: AuditLoggerService,
  ) {}

  /**
   * Create order (tenant-isolated)
   */
  async create(
    dto: CreateOrderDto,
    tenantId: string,  // ← NEW parameter
    adminId?: string,
  ): Promise<Order> {
    // Validate tenant ownership of user_id, rider_id, etc.
    const user = await this.usersRepository.findOne({
      where: { id: dto.user_id, tenant_id: tenantId },  // ← Tenant filter
    });

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    const order = this.orderRepository.create({
      ...dto,
      tenant_id: tenantId,  // ← Automatically set
    });

    const saved = await this.orderRepository.save(order);

    // Audit log includes tenant
    if (adminId) {
      await this.auditLogger.log({
        tenant_id: tenantId,  // ← NEW
        userId: adminId,
        resource: 'orders',
        action: 'create',
        entityId: saved.id,
      });
    }

    return saved;
  }

  /**
   * Find all orders (auto-filtered by tenant)
   */
  async findAll(
    query: QueryOrdersDto,
    tenantId: string,  // ← NEW parameter
  ): Promise<{ data: Order[]; total: number }> {
    let queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .where('order.tenant_id = :tenantId', { tenantId });  // ← Key filter

    // Apply other filters on top
    if (query.status) {
      queryBuilder = queryBuilder.andWhere('order.status = :status', {
        status: query.status,
      });
    }

    // ... rest of query building ...

    return { data, total };
  }

  /**
   * Find single order (verify tenant ownership)
   */
  async findOne(id: string, tenantId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,  // ← Verify ownership
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Update order (verify tenant ownership)
   */
  async update(
    id: string,
    dto: UpdateOrderDto,
    tenantId: string,  // ← NEW parameter
    adminId: string,
  ): Promise<Order> {
    const order = await this.findOne(id, tenantId);
    
    // ... update logic ...

    // Audit includes tenant
    if (changes.length > 0) {
      await this.auditLogger.log({
        tenant_id: tenantId,  // ← NEW
        userId: adminId,
        resource: 'orders',
        action: 'update',
        entityId: id,
        changes,
      });
    }

    return updated;
  }
}
```

---

## 🌐 Controller Layer Changes

### Updated Controller Pattern

```typescript
// src/orders/controllers/orders.controller.ts

@Controller('admin/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * GET /api/v1/admin/orders
   */
  @Get()
  @UseGuards(RolesGuard, TenantGuard)  // ← Add TenantGuard
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findAll(
    @Query() query: QueryOrdersDto,
    @CurrentTenant() tenantId: string,  // ← NEW: Extract tenant
    @Request() req: ExpressRequest,
  ) {
    const { data, total } = await this.ordersService.findAll(
      query,
      tenantId  // ← Pass to service
    );

    return {
      statusCode: 200,
      message: 'Success',
      data,
      pagination: { total, page: query.page || 1, ... },
    };
  }

  /**
   * POST /api/v1/admin/orders
   */
  @Post()
  @UseGuards(RolesGuard, TenantGuard)  // ← Add TenantGuard
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentTenant() tenantId: string,  // ← NEW
    @Request() req: ExpressRequest,
  ) {
    const order = await this.ordersService.create(
      createOrderDto,
      tenantId,  // ← Pass to service
      req.user?.['id'],
    );

    return {
      statusCode: 201,
      message: 'Order created successfully',
      data: order,
    };
  }

  /**
   * GET /api/v1/admin/orders/:id
   */
  @Get(':id')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,  // ← NEW
  ) {
    const order = await this.ordersService.findOne(id, tenantId);

    return {
      statusCode: 200,
      message: 'Success',
      data: order,
    };
  }

  // ... etc for all endpoints ...
}
```

---

## 🔑 JWT Token Structure

### Updated JWT Payload

```typescript
// src/auth/auth.service.ts

async login(user: User) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id,  // ← NEW: Include tenant in token
    permissions: user.permissions,
  };

  return {
    access_token: this.jwtService.sign(payload),
    refresh_token: this.jwtService.sign(payload, {
      expiresIn: '7d',
    }),
  };
}
```

---

## 📊 Database Migration Strategy

### Migration Order (CRITICAL)

**Step 1:** Create Tenants table
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255),
  status VARCHAR(50),
  plan VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Step 2:** Add tenant_id to Users
```sql
ALTER TABLE users 
ADD COLUMN tenant_id UUID NOT NULL;

ALTER TABLE users 
ADD CONSTRAINT fk_users_tenant 
FOREIGN KEY (tenant_id) 
REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
```

**Step 3:** Add tenant_id to all domain entities
```sql
-- Orders
ALTER TABLE orders ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE orders ADD CONSTRAINT fk_orders_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_tenant_created ON orders(tenant_id, created_at);

-- OrderItems (via order_id already enforces tenant isolation)
-- But add for direct queries:
ALTER TABLE order_items ADD COLUMN tenant_id UUID NOT NULL;
CREATE INDEX idx_order_items_tenant_id ON order_items(tenant_id);

-- Products
ALTER TABLE products ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE products ADD CONSTRAINT fk_products_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_products_tenant_id ON products(tenant_id);

-- Categories
ALTER TABLE categories ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE categories ADD CONSTRAINT fk_categories_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);

-- Deliveries
ALTER TABLE deliveries ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE deliveries ADD CONSTRAINT fk_deliveries_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_deliveries_tenant_id ON deliveries(tenant_id);

-- Riders
ALTER TABLE riders ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE riders ADD CONSTRAINT fk_riders_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_riders_tenant_id ON riders(tenant_id);

-- AuditLogs
ALTER TABLE audit_logs ADD COLUMN tenant_id UUID NOT NULL;
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
```

---

## 🛡️ Data Isolation Rules

### Rule 1: Automatic Tenant Filtering
Every query must include `WHERE tenant_id = ?`
```typescript
// ❌ WRONG
const orders = await this.orderRepository.find();

// ✅ CORRECT
const orders = await this.orderRepository.find({
  where: { tenant_id: currentTenantId }
});
```

### Rule 2: Cross-Tenant Validation
Before any operation, verify ownership:
```typescript
// When updating an order, verify it belongs to current tenant
const order = await this.orderRepository.findOne({
  where: {
    id: orderId,
    tenant_id: currentTenantId  // ← Verify ownership
  }
});

if (!order) {
  throw new NotFoundException('Order not found');
}
```

### Rule 3: Related Entity Validation
When accessing related entities, verify same tenant:
```typescript
// When assigning rider to delivery, verify:
// 1. Delivery belongs to current tenant
// 2. Rider belongs to current tenant
const [delivery, rider] = await Promise.all([
  this.deliveryRepository.findOne({
    where: { id: deliveryId, tenant_id: tenantId }
  }),
  this.riderRepository.findOne({
    where: { id: riderId, tenant_id: tenantId }  // ← Key check
  })
]);

if (!delivery || !rider) {
  throw new NotFoundException('Resource not found in this tenant');
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Core (Before Migration)
- [ ] Create Tenant entity
- [ ] Update User entity (add tenant_id, relationship)
- [ ] Update all 6 domain entities (add tenant_id, relationship)
- [ ] Create TenantMiddleware
- [ ] Create TenantGuard
- [ ] Create CurrentTenant decorator
- [ ] Update AuditLoggerService (include tenant_id)
- [ ] Create multi-tenancy documentation

### Phase 2: Service Updates (After Entities)
- [ ] Update OrdersService (add tenantId parameter)
- [ ] Update ProductsService
- [ ] Update CategoriesService
- [ ] Update DeliveriesService
- [ ] Update RidersService
- [ ] Create TenantsService (CRUD for tenants)

### Phase 3: Controller Updates (After Services)
- [ ] Update OrdersController (@CurrentTenant decorator)
- [ ] Update ProductsController
- [ ] Update CategoriesController
- [ ] Update DeliveriesController
- [ ] Update RidersController
- [ ] Create TenantsController

### Phase 4: Auth Updates
- [ ] Update JWT payload (include tenant_id)
- [ ] Update login/register flow
- [ ] Verify tenant assignment on registration

### Phase 5: Database
- [ ] Create migrations in correct order
- [ ] Add indexes for performance
- [ ] Seed default tenant (for testing)

---

## 📈 Multi-Tenancy Benefits

```
✅ Single codebase serves unlimited customers
✅ Data isolation (security)
✅ Easy onboarding (new tenant = new row, not new database)
✅ Cost-effective (shared infrastructure)
✅ Scalable (grow without database multiplication)
✅ Backup/restore (single database)
✅ GDPR compliant (tenant data isolated)
✅ Multi-region ready (replicate by tenant)
```

---

## 🚀 Example: Multi-Tenant Request Flow

```
1. User logs in with email: "admin@acme.com"
   Response includes JWT with tenant_id: "acme-org-uuid"

2. User requests: GET /api/v1/admin/orders
   Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInRlbmFudF9pZCI6ImFjbWUtb3JnLXV1aWQifQ...

3. TenantMiddleware extracts tenant_id from token
   req.user.tenant_id = "acme-org-uuid"

4. TenantGuard validates tenant access
   Ensures user's tenant matches request tenant

5. Controller injects @CurrentTenant()
   tenantId = "acme-org-uuid"

6. Service queries with tenant filter
   SELECT * FROM orders WHERE tenant_id = 'acme-org-uuid'

7. Response includes only ACME's orders
   ✅ No data leakage to other tenants
```

---

## 🔐 Security Considerations

### XSS Prevention
- ✅ Tenant_id from JWT (not URL)
- ✅ URL-based tenant_id requires verification

### SQL Injection Prevention
- ✅ TypeORM parameterized queries
- ✅ Automatic tenant filter prevents bypassing

### Data Leakage Prevention
- ✅ Every query includes tenant_id filter
- ✅ Audit logging catches unauthorized attempts
- ✅ Guard validates tenant ownership

### Tenant Escalation Prevention
- ✅ User can only access their own tenant
- ✅ Admin within tenant can't access other tenants
- ✅ Role-based access within tenant

---

## 🎊 Summary

**Multi-tenancy makes Shago a true SaaS platform:**

1. **Single database** serves multiple customers
2. **Row-level isolation** ensures security
3. **Tenant in JWT** simplifies access control
4. **Guard + Middleware** enforce isolation
5. **Service layer** auto-filters by tenant
6. **Migrations** create proper schema
7. **Zero code duplication** for multi-tenant support

**Implementation effort:** ~2-3 hours for all 7 entities + services + controllers

**Business impact:** Enables unlimited customer onboarding without infrastructure overhead

