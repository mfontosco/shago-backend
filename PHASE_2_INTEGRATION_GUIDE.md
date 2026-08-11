# Phase 2 Integration Guide - Orders Module

**Status:** Ready to integrate  
**Time Needed:** 15 minutes  
**Difficulty:** Easy

---

## 🚀 4-Step Integration Process

### Step 1: Update App Module (2 min)

**Edit:** `src/app.module.ts`

**Add imports at top:**
```typescript
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
```

**Update TypeOrmModule.forRootAsync entities array:**
```typescript
entities: [
  User,
  Categeories,
  Attributes,
  AttributeValue,
  Product,
  ProductImage,
  ProductVariant,
  VariantAttribute,
  Role,
  Permission,
  AuditLog,
  Order,          // ← Add this
  OrderItem,      // ← Add this
],
```

**Update imports array:**
```typescript
imports: [
  // ... existing imports
  OrdersModule,   // ← Add this at the end
],
```

---

### Step 2: Generate Database Migration (2 min)

**Run command:**
```bash
npm run migration:generate -- CreateOrdersTable
```

**What it does:**
- Generates SQL migration file
- Creates `orders` table with all columns
- Creates `order_items` table with relationships
- Adds indexes for performance

**Check result:**
- Look in `src/migrations/` for new file
- Review the SQL (should look correct)

---

### Step 3: Run Migration (2 min)

**Run command:**
```bash
npm run migration:run
```

**What it does:**
- Executes migration SQL on database
- Creates tables in PostgreSQL
- Creates indexes
- Ready to insert data

---

### Step 4: Start Server & Test (5 min)

**Start dev server:**
```bash
npm run start:dev
```

**Should see:**
```
✅ Server running on http://localhost:3000
✅ TypeORM connected
✅ Migrations synced
```

**Test Orders API:**

```bash
# 1. List orders (should be empty)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/v1/admin/orders

# Response:
{
  "statusCode": 200,
  "message": "Success",
  "data": [],
  "pagination": { "total": 0, "page": 1, "limit": 20, "pages": 0 }
}

# 2. Get dashboard stats
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/v1/admin/orders/stats/dashboard

# Response:
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "total_orders": 0,
    "pending_orders": 0,
    "confirmed_orders": 0,
    "delivered_orders": 0,
    "total_revenue": 0,
    "average_order_value": 0
  }
}

# 3. Try creating order (will test with real data)
curl -X POST http://localhost:3000/api/v1/admin/orders \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_UUID",
    "items": [
      {
        "product_id": "YOUR_PRODUCT_UUID",
        "quantity": 1,
        "unit_price": 99.99
      }
    ],
    "delivery_address": "123 Main St, City",
    "delivery_latitude": 40.7128,
    "delivery_longitude": -74.0060,
    "payment_method": "cash"
  }'
```

---

## ✅ Verification Checklist

After integration, verify:

- [ ] Server starts: `npm run start:dev`
- [ ] No TypeORM errors in console
- [ ] GET /admin/orders returns 200
- [ ] Can list orders (empty list initially)
- [ ] Stats endpoint works
- [ ] Authorization works (401 without token)
- [ ] 403 returned for non-admin users

---

## 🧪 Create Sample Data (Optional)

To test with real data:

```bash
# 1. Get a user UUID
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/v1/users/me | grep id

# 2. Get a product UUID  
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/v1/products | grep id

# 3. Create order with those UUIDs
curl -X POST http://localhost:3000/api/v1/admin/orders \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_UUID",
    "items": [{"product_id": "PRODUCT_UUID", "quantity": 2, "unit_price": 49.99}],
    "delivery_address": "123 Main St",
    "delivery_latitude": 40.7128,
    "delivery_longitude": -74.0060,
    "payment_method": "cash"
  }'

# 4. List orders (should show your order)
curl http://localhost:3000/api/v1/admin/orders
```

---

## 📊 File Locations

All Orders module files are here:

```
src/orders/
├── entities/
│   ├── order.entity.ts           (Order schema - 20 columns)
│   └── order-item.entity.ts      (Item schema - 8 columns)
├── services/
│   └── orders.service.ts         (Business logic - 10 methods)
├── controllers/
│   └── orders.controller.ts      (HTTP endpoints - 9 routes)
├── dtos/
│   └── create-order.dto.ts       (Input/output formats)
└── orders.module.ts              (Module exports)

Total: 6 files, 950+ lines of code
```

---

## 🎯 Endpoints Now Available

After integration:

```
GET    /api/v1/admin/orders
POST   /api/v1/admin/orders
GET    /api/v1/admin/orders/:id
PATCH  /api/v1/admin/orders/:id
PATCH  /api/v1/admin/orders/:id/status
PATCH  /api/v1/admin/orders/:id/assign-rider
DELETE /api/v1/admin/orders/:id
GET    /api/v1/admin/orders/stats/dashboard
GET    /api/v1/admin/orders/stats/today
```

All protected with `@Roles('ADMIN', 'SUPER_ADMIN')`

---

## 🚨 Troubleshooting

### Migration fails
```bash
# Check migration file in src/migrations/
# Look for syntax errors in SQL
# Try re-running:
npm run migration:run
```

### TypeORM error: "Unknown column"
```bash
# Make sure you updated app.module.ts entities array
# Make sure migration ran successfully
npm run migration:run
```

### Endpoints return 404
```bash
# Make sure OrdersModule imported in app.module.ts
# Make sure server restarted after changes
npm run start:dev
```

### Authorization fails (403)
```bash
# Need admin token
# Login with admin account first
curl -X POST http://localhost:3000/api/v1/auth/login \
  -d '{"email":"admin@example.com","password":"password"}'
```

---

## 📝 Next Module Pattern

For Products (Days 3-4), follow identical pattern:

1. Create `src/products/entities/product.entity.ts`
2. Create `src/products/dtos/create-product.dto.ts`
3. Create `src/products/services/products.service.ts` (6 endpoints)
4. Create `src/products/controllers/products.controller.ts`
5. Create `src/products/products.module.ts`
6. Update `src/app.module.ts`
7. Generate & run migration
8. Test endpoints

Same architecture = fast, predictable implementation!

---

## ✨ You're Ready!

Everything is prepared. Just:

1. Copy the 4 integration steps above
2. Follow them in order (15 minutes total)
3. Test endpoints
4. Move to Products module

**Current Status:** ✅ Orders module 100% ready  
**Integration Time:** 15 minutes  
**Lines to Change:** ~10 lines in app.module.ts  

Let's go! 🚀

---

**Phase 2 Integration:** ✅ **Ready to Execute**
