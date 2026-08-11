# Multi-Tenancy Entity Updates - Step by Step

**Status:** Implementation Guide  
**Time Required:** 30 minutes  
**Entities to Update:** 6 (User, Order, OrderItem, Product, Category, Delivery, Rider)

---

## 🔑 Key Changes for All Entities

Add to EVERY entity that should be tenant-isolated:

```typescript
// At the top of entity file, with other imports:
import { Tenant } from '../../tenants/entities/tenant.entity';

// In the entity class:

@Column('uuid')
tenant_id: string;

@ManyToOne(() => Tenant, {
  onDelete: 'CASCADE'
})
@JoinColumn({ name: 'tenant_id' })
tenant: Tenant;

// Add to @Index decorators:
@Index(['tenant_id'])
@Index(['tenant_id', 'created_at'])
@Index(['tenant_id', 'status'])  // if entity has status
```

---

## 📝 Updating Each Entity

### 1. User Entity

**File:** `src/users/entities/user.entities.ts`

**Add these imports:**
```typescript
import { Tenant } from '../../tenants/entities/tenant.entity';
```

**Add to entity class:**
```typescript
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  email: string;

  // ... existing fields ...

  // ← ADD BELOW:
  @Column('uuid')
  tenant_id: string;  // Which tenant does this user belong to?

  @ManyToOne(() => Tenant, {
    onDelete: 'CASCADE'  // If tenant deleted, delete users
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ... rest of entity ...
}
```

**Update indexes:**
```typescript
@Entity('users')
@Index(['email'])  // Existing
@Index(['tenant_id'])  // ← ADD THIS
@Index(['tenant_id', 'email'])  // ← ADD THIS for fast tenant-specific email lookup
export class User {
  // ...
}
```

---

### 2. Order Entity

**File:** `src/orders/entities/order.entity.ts`

**Add these imports:**
```typescript
import { Tenant } from '../../tenants/entities/tenant.entity';
```

**Add to entity class (after @Entity decorator):**
```typescript
@Entity('orders')
@Index(['tenant_id'])  // ← ADD
@Index(['tenant_id', 'created_at'])  // ← ADD
@Index(['tenant_id', 'status'])  // ← ADD
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← ADD THIS

  @Column('uuid')
  user_id: string;

  // ... existing fields (status, total_price, etc.) ...

  // ← ADD BELOW:
  @ManyToOne(() => Tenant, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ... existing relationships (user, items) ...
}
```

---

### 3. OrderItem Entity

**File:** `src/orders/entities/order-item.entity.ts`

**Add these imports:**
```typescript
import { Tenant } from '../../tenants/entities/tenant.entity';
```

**Add to entity class:**
```typescript
@Entity('order_items')
@Index(['tenant_id'])  // ← ADD
@Index(['order_id', 'tenant_id'])  // ← ADD
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← ADD THIS

  @Column('uuid')
  order_id: string;

  // ... existing fields ...

  // ← ADD BELOW:
  @ManyToOne(() => Tenant, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ... existing relationships ...
}
```

---

### 4. Product Entity

**File:** `src/product/entities/products.entities.ts`

**Add these imports:**
```typescript
import { Tenant } from '../../tenants/entities/tenant.entity';
```

**Add to entity class:**
```typescript
@Entity('products')
@Index(['tenant_id'])  // ← ADD
@Index(['tenant_id', 'status'])  // ← ADD
@Index(['tenant_id', 'created_at'])  // ← ADD
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← ADD THIS

  // ... existing fields (name, sku, price, stock, etc.) ...

  // ← ADD BELOW:
  @ManyToOne(() => Tenant, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ... existing relationships ...
}
```

---

### 5. Category Entity

**File:** `src/categories/entities/categories.entities.ts`

**Add these imports:**
```typescript
import { Tenant } from '../../tenants/entities/tenant.entity';
```

**Add to entity class:**
```typescript
@Entity('categories')
@Index(['tenant_id'])  // ← ADD
@Index(['tenant_id', 'name'])  // ← ADD for tenant-specific category lookup
export class Categeories {  // Note: keep typo for now to match existing code
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← ADD THIS

  @Column('varchar', { length: 255 })
  name: string;

  // ... existing fields ...

  // ← ADD BELOW:
  @ManyToOne(() => Tenant, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ... existing relationships ...
}
```

---

### 6. Delivery Entity

**File:** `src/delivery/entities/delivery.entity.ts`

**Add these imports:**
```typescript
import { Tenant } from '../../tenants/entities/tenant.entity';
```

**Update @Entity decorators:**
```typescript
@Entity('deliveries')
@Index(['tenant_id'])  // ← ADD
@Index(['tenant_id', 'status'])  // ← ADD
@Index(['tenant_id', 'rider_id'])  // ← ADD
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← ADD THIS

  @Column('uuid')
  order_id: string;

  // ... existing fields ...

  // ← ADD BELOW:
  @ManyToOne(() => Tenant, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ... existing relationships ...
}
```

---

### 7. Rider Entity

**File:** `src/delivery/entities/rider.entity.ts`

**Add these imports:**
```typescript
import { Tenant } from '../../tenants/entities/tenant.entity';
```

**Update @Entity decorators:**
```typescript
@Entity('riders')
@Index(['tenant_id'])  // ← ADD
@Index(['tenant_id', 'status'])  // ← ADD
export class Rider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← ADD THIS

  @Column('varchar', { length: 255 })
  name: string;

  // ... existing fields ...

  // ← ADD BELOW:
  @ManyToOne(() => Tenant, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ... existing relationships ...
}
```

---

## 🔧 Update AuditLog Entity

**File:** `src/audit-logs/entities/audit-log.entity.ts`

**Add these imports:**
```typescript
import { Tenant } from '../../tenants/entities/tenant.entity';
```

**Add to entity class:**
```typescript
@Entity('audit_logs')
@Index(['tenant_id'])  // ← ADD
@Index(['tenant_id', 'created_at'])  // ← ADD
@Index(['resource', 'action', 'tenant_id'])  // ← ADD
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← ADD THIS (track which tenant performed action)

  // ... existing fields (userId, resource, action, etc.) ...

  // ← ADD BELOW:
  @ManyToOne(() => Tenant, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ... rest of entity ...
}
```

---

## ✅ Checklist

After updating all entities:

- [ ] User entity has `tenant_id` column and relationship
- [ ] Order entity has `tenant_id` column and relationship
- [ ] OrderItem entity has `tenant_id` column and relationship
- [ ] Product entity has `tenant_id` column and relationship
- [ ] Category entity has `tenant_id` column and relationship
- [ ] Delivery entity has `tenant_id` column and relationship
- [ ] Rider entity has `tenant_id` column and relationship
- [ ] AuditLog entity has `tenant_id` column and relationship
- [ ] All entities have proper indexes for tenant filtering
- [ ] All foreign keys use `onDelete: 'CASCADE'`
- [ ] No TypeScript compilation errors

---

## 🔍 Quick Verification

After updates, run:

```bash
# Check for TypeScript errors
npm run build

# Should compile without errors
```

If you see errors about missing Tenant import or relationship, ensure:
1. All files imported `Tenant` entity
2. All `@ManyToOne` decorators are added
3. All `@JoinColumn` decorators are correct

---

## 📊 Database Migration

After updating entities, generate migration:

```bash
npm run migration:generate -- AddTenantIdsToAllEntities
```

This will create SQL to add `tenant_id` column to all tables.

**Order of migrations:**
1. Create Tenants table (already in our Tenant entity)
2. Add tenant_id to Users
3. Add tenant_id to Orders, OrderItems
4. Add tenant_id to Products, Categories
5. Add tenant_id to Deliveries, Riders
6. Add tenant_id to AuditLogs

TypeORM should handle this in correct order.

---

## 🎯 What This Accomplishes

After these updates:

```
✅ Every entity tracked to its tenant
✅ Database enforces tenant isolation (CASCADE delete)
✅ Queries can filter by tenant efficiently (indexes)
✅ Audit trail captures which tenant performed actions
✅ Ready for service layer tenant-filtering
✅ Ready for API guards to enforce tenant access
```

---

## 📚 Example: After Updates

User from "Acme Corp" tenant requests orders:

```
1. User logs in → JWT includes tenant_id: "acme-uuid"

2. GET /api/v1/admin/orders
   Header: Authorization: Bearer eyJtenantId: "acme-uuid"}

3. Service query:
   SELECT * FROM orders 
   WHERE tenant_id = 'acme-uuid'  ← Only Acme's orders

4. Response: Only Acme's 150 orders (not other tenants' 5000 orders)
```

---

## 🚀 Next Steps After Entity Updates

1. ✅ Update all 8 entities (you're here)
2. Update all services to include `tenantId` parameter
3. Update all controllers to use `@CurrentTenant()` decorator
4. Update app.module.ts to register TenantMiddleware
5. Generate migrations
6. Run migrations
7. Test tenant isolation

See `MULTI_TENANCY_SERVICE_UPDATES.md` for next phase.

