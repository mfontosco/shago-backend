# Rename API Routes: /admin → /vendor

**Scope:** Update all controller routes from `/admin` to `/vendor`  
**Impact:** All 40 endpoints  
**Time:** 1-2 hours  
**When:** Before Week 1 of backend-frontend alignment

---

## 🎯 The Change

### Current (Wrong for Vendor Dashboard)
```
GET    /api/v1/admin/orders

POST   /api/v1/admin/orders
GET    /api/v1/admin/products
POST   /api/v1/admin/products
GET    /api/v1/admin/deliveries
POST   /api/v1/admin/deliveries
GET    /api/v1/admin/riders
POST   /api/v1/admin/riders
```

### New (Correct for Vendor Dashboard)
```
GET    /api/v1/vendor/orders
POST   /api/v1/vendor/orders
GET    /api/v1/vendor/products
POST   /api/v1/vendor/products
GET    /api/v1/vendor/deliveries
POST   /api/v1/vendor/deliveries
GET    /api/v1/vendor/riders
POST   /api/v1/vendor/riders
```

---

## 📋 Files to Update

### 1. Orders Controller
**File:** `src/orders/controllers/orders.controller.ts`

**Before:**
```typescript
@Controller('admin/orders')
export class OrdersController {
```

**After:**
```typescript
@Controller('vendor/orders')
export class OrdersController {
```


### 2. Products Controller
**File:** `src/products/controllers/products.controller.upload.ts`

**Before:**
```typescript
@Controller('admin/products')
export class ProductsController {
```

**After:**

```typescript
@Controller('vendor/products')
export class ProductsController {
```

### 3. Categories Controller
**File:** `src/categories/controllers/categories.controller.ts`

**Before:**
```typescript
@Controller('admin/categories')
export class CategoriesController {
```

**After:**
```typescript
@Controller('vendor/categories')
export class CategoriesController {
```

### 4. Deliveries Controller
**File:** `src/delivery/controllers/deliveries.controller.ts`

**Before:**
```typescript
@Controller('admin/deliveries')
export class DeliveriesController {
```

**After:**
```typescript
@Controller('vendor/deliveries')
export class DeliveriesController {
```

### 5. Riders Controller
**File:** `src/delivery/controllers/riders.controller.ts`

**Before:**
```typescript
@Controller('admin/riders')
export class RidersController {
```

**After:**
```typescript
@Controller('vendor/riders')
export class RidersController {
```

### 6. Tenants Controller (New Admin-Only)
**File:** `src/tenants/controllers/tenants.controller.ts`

**Create with:**
```typescript
@Controller('admin/tenants')  // ← This is ADMIN only (platform)
export class TenantsController {
```

---

## 🔄 Find & Replace

### In VS Code

1. Open backend folder in VS Code
2. **Ctrl+Shift+H** (Find & Replace)
3. **Find:** `@Controller('admin/`
4. **Replace:** `@Controller('vendor/`
5. **Click Replace All**
6. **Review:** Make sure only vendor endpoints are changed
7. **Keep:** Any tenants/superadmin paths as `admin/`

---

## ✅ Complete List of Endpoints After Change

### Vendor Endpoints (Restaurants Use These)

```
Orders:
GET    /api/v1/vendor/orders
POST   /api/v1/vendor/orders
GET    /api/v1/vendor/orders/:id
PATCH  /api/v1/vendor/orders/:id
PATCH  /api/v1/vendor/orders/:id/status
PATCH  /api/v1/vendor/orders/:id/assign-rider
DELETE /api/v1/vendor/orders/:id
GET    /api/v1/vendor/orders/stats/dashboard
GET    /api/v1/vendor/orders/stats/todays-sales

Products:
GET    /api/v1/vendor/products
POST   /api/v1/vendor/products
GET    /api/v1/vendor/products/:id
PATCH  /api/v1/vendor/products/:id
PATCH  /api/v1/vendor/products/:id/stock
PATCH  /api/v1/vendor/products/:id/image
PATCH  /api/v1/vendor/products/:id/archive
DELETE /api/v1/vendor/products/:id
GET    /api/v1/vendor/products/search/:query
GET    /api/v1/vendor/products/low-stock
GET    /api/v1/vendor/products/stats/count
GET    /api/v1/vendor/products/stats/inventory-value

Categories:
GET    /api/v1/vendor/categories
POST   /api/v1/vendor/categories
GET    /api/v1/vendor/categories/:id
GET    /api/v1/vendor/categories/:id/products
PATCH  /api/v1/vendor/categories/:id
DELETE /api/v1/vendor/categories/:id

Deliveries:
GET    /api/v1/vendor/deliveries
POST   /api/v1/vendor/deliveries
GET    /api/v1/vendor/deliveries/:id
PATCH  /api/v1/vendor/deliveries/:id
PATCH  /api/v1/vendor/deliveries/:id/assign-rider
PATCH  /api/v1/vendor/deliveries/:id/status
DELETE /api/v1/vendor/deliveries/:id
GET    /api/v1/vendor/deliveries/stats/dashboard

Riders:
GET    /api/v1/vendor/riders
POST   /api/v1/vendor/riders
GET    /api/v1/vendor/riders/:id
GET    /api/v1/vendor/riders/available
PATCH  /api/v1/vendor/riders/:id
PATCH  /api/v1/vendor/riders/:id/status
DELETE /api/v1/vendor/riders/:id
GET    /api/v1/vendor/riders/stats/dashboard
```

### Admin Endpoints (Shago Team Uses These - Future)

```
Tenants:
GET    /api/v1/admin/tenants
POST   /api/v1/admin/tenants
GET    /api/v1/admin/tenants/:id
PATCH  /api/v1/admin/tenants/:id
DELETE /api/v1/admin/tenants/:id

Users (Platform):
GET    /api/v1/admin/users
POST   /api/v1/admin/users
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id
DELETE /api/v1/admin/users/:id

(More admin endpoints when admin dashboard is built)
```

---

## 🔗 Update Frontend API Calls

All references in `NEXT_3_WEEKS_ACTION_PLAN.md` use:
```
const BASE_URL = 'http://localhost:8000/api/v1/vendor'
```

**This will now be correct!** ✅

---

## 📝 JSDoc Updates

Update all JSDoc comments:

**Before:**
```typescript
/**
 * GET /api/v1/admin/orders
 * List all orders
 */
```

**After:**
```typescript
/**
 * GET /api/v1/vendor/orders
 * List all vendor orders
 */
```

---

## 🧪 Testing After Change

```bash
# Test each endpoint to verify routes work
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/vendor/orders

curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pizza"}' \
  http://localhost:8000/api/v1/vendor/products

# All should return 200 (or expected status)
```

---

## 🎯 Checklist

- [ ] Update `orders.controller.ts` - @Controller('vendor/orders')
- [ ] Update `products.controller.upload.ts` - @Controller('vendor/products')
- [ ] Update `categories.controller.ts` - @Controller('vendor/categories')
- [ ] Update `deliveries.controller.ts` - @Controller('vendor/deliveries')
- [ ] Update `riders.controller.ts` - @Controller('vendor/riders')
- [ ] Update all JSDoc comments in controllers
- [ ] Update README to show /vendor/ endpoints
- [ ] Test all endpoints work with new routes
- [ ] Commit with message: "refactor: rename /admin/ routes to /vendor/ for vendor dashboard"

---

## 🚀 When to Do This

**Best timing:** This week, before starting Week 1 of backend-frontend alignment

This ensures frontend development starts with correct endpoint paths from day one.

---

## ✅ Result

After this change:
```
✅ Endpoint paths match dashboard purpose
✅ Vendor dashboard has /vendor/ routes
✅ Future admin dashboard will have /admin/ routes
✅ Clear semantic separation
✅ Professional API structure
✅ Frontend development uses correct paths
```

---

**Quick command to do this:**

```bash
cd shago-backend

# Update controllers
sed -i "s/@Controller('admin\//@Controller('vendor\//g" src/*/controllers/*.ts

# Verify changes
grep -r "@Controller('vendor/" src/*/controllers/

# Should show all 5 vendor controllers ✓
```

