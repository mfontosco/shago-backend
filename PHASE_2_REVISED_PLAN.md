# Phase 2 (Revised): Business Domain APIs for Admin Dashboard

**Alignment:** Shago Admin Dashboard UI Requirements  
**Status:** 🚀 Refocused on Real UI Needs  
**Date:** August 10, 2026

---

## 🎯 New Focus

**Previous:** Generic admin operations (roles, permissions, features)  
**Now:** Business domain APIs for actual admin dashboard pages

The admin UI has these sections - Phase 2 will build APIs for all of them:

```
Admin Dashboard Structure:
├── Dashboard                 → Statistics/Overview APIs
├── Orders                    → Order management APIs
├── Products                  → Product management APIs
├── Product Categories        → Category management APIs
├── Inventory                 → Stock management APIs
├── Delivery & Riders         → Delivery tracking APIs
├── Payments                  → Payment management APIs
├── Users                     → User management APIs
├── Reports                   → Analytics/Reports APIs
├── Marketing                 → Campaign/Contact APIs
├── Support & Feedback        → Support ticket APIs
└── Settings                  → System configuration APIs
```

---

## 📊 Phase 2 Deliverables (Aligned with UI)

### Week 1: Core Business Operations

#### Days 1-2: Dashboard & Orders APIs
**Dashboard Endpoints:**
```
GET    /api/v1/admin/dashboard/stats       → Today's sales, orders, visitors
GET    /api/v1/admin/dashboard/charts      → Sales/purchase chart data
GET    /api/v1/admin/dashboard/summary     → KPI summary
```

**Order Endpoints:**
```
GET    /api/v1/admin/orders                → List orders (paginated, filterable)
GET    /api/v1/admin/orders/:id            → Order details
GET    /api/v1/admin/orders/:id/items      → Order items
PATCH  /api/v1/admin/orders/:id/status     → Update order status
PATCH  /api/v1/admin/orders/:id/assign-rider → Assign delivery rider
GET    /api/v1/admin/orders/export         → Export orders
```

#### Days 3-4: Products & Inventory APIs
**Product Endpoints:**
```
GET    /api/v1/admin/products              → List products (paginated)
POST   /api/v1/admin/products              → Create product
GET    /api/v1/admin/products/:id          → Product details
PATCH  /api/v1/admin/products/:id          → Update product
DELETE /api/v1/admin/products/:id          → Archive product
GET    /api/v1/admin/products/stock        → Low stock alerts
```

**Category Endpoints:**
```
GET    /api/v1/admin/categories            → List categories
POST   /api/v1/admin/categories            → Create category
PATCH  /api/v1/admin/categories/:id        → Update category
DELETE /api/v1/admin/categories/:id        → Delete category
```

**Inventory Endpoints:**
```
GET    /api/v1/admin/inventory             → Stock levels
PATCH  /api/v1/admin/inventory/:product-id → Update stock
GET    /api/v1/admin/inventory/low-stock   → Low stock items
POST   /api/v1/admin/inventory/import      → Bulk import
```

#### Day 5: Payments APIs
**Payment Endpoints:**
```
GET    /api/v1/admin/payments              → Payment transactions
GET    /api/v1/admin/payments/stats        → Payment statistics
GET    /api/v1/admin/payments/:id          → Payment details
PATCH  /api/v1/admin/payments/:id/confirm  → Confirm payment
GET    /api/v1/admin/payments/export       → Export transactions
```

---

### Week 2: Delivery, Users & Advanced

#### Days 6-7: Delivery & Riders APIs
**Delivery Endpoints:**
```
GET    /api/v1/admin/delivery/tasks        → Delivery tasks
GET    /api/v1/admin/delivery/tasks/:id    → Task details
PATCH  /api/v1/admin/delivery/tasks/:id    → Update task status
GET    /api/v1/admin/delivery/tracking     → Real-time tracking
```

**Rider Endpoints:**
```
GET    /api/v1/admin/riders                → List riders
GET    /api/v1/admin/riders/:id            → Rider profile
PATCH  /api/v1/admin/riders/:id/status     → Change rider status
GET    /api/v1/admin/riders/analytics      → Rider performance
```

#### Days 8-9: Users & Support APIs
**User Management:**
```
GET    /api/v1/admin/users                 → List all users
GET    /api/v1/admin/users/:id             → User details
PATCH  /api/v1/admin/users/:id             → Update user
POST   /api/v1/admin/users/:id/suspend     → Suspend user
```

**Support/Feedback:**
```
GET    /api/v1/admin/support/tickets       → Support tickets
GET    /api/v1/admin/support/tickets/:id   → Ticket details
PATCH  /api/v1/admin/support/tickets/:id   → Update ticket
POST   /api/v1/admin/support/tickets/:id/reply → Send reply
GET    /api/v1/admin/feedback              → User feedback
```

#### Day 10: Reports, Marketing & Settings
**Reports/Analytics:**
```
GET    /api/v1/admin/reports/sales         → Sales reports
GET    /api/v1/admin/reports/products      → Product reports
GET    /api/v1/admin/reports/revenue       → Revenue analysis
GET    /api/v1/admin/reports/export        → Export reports
```

**Marketing:**
```
GET    /api/v1/admin/marketing/campaigns   → Marketing campaigns
POST   /api/v1/admin/marketing/campaigns   → Create campaign
GET    /api/v1/admin/marketing/contacts    → Contact list
POST   /api/v1/admin/marketing/message     → Send message
```

**System Settings:**
```
GET    /api/v1/admin/settings              → Get all settings
PATCH  /api/v1/admin/settings/company      → Company settings
PATCH  /api/v1/admin/settings/fees         → Commission/fee settings
PATCH  /api/v1/admin/settings/delivery     → Delivery settings
```

---

## 📈 API Count by Week

### Week 1
```
Dashboard:     3 endpoints
Orders:        6 endpoints
Products:      6 endpoints
Categories:    4 endpoints
Inventory:     4 endpoints
Payments:      5 endpoints

Total Week 1:  28 endpoints ✨
```

### Week 2
```
Delivery:      4 endpoints
Riders:        4 endpoints
Users:         4 endpoints
Support:       5 endpoints
Reports:       4 endpoints
Marketing:     4 endpoints
Settings:      3 endpoints

Total Week 2:  28 endpoints ✨
```

### **Grand Total: 56 Endpoints** 🎉

---

## 🗄️ Database Entities Needed

### Core Entities (Already Exist)
```
✅ User
✅ Product
✅ Category
✅ ProductVariant
✅ ProductImage
```

### New Entities Phase 2

**Orders & Items:**
```
Order
├── id, user_id, status, total_price
├── delivery_address, payment_method
├── created_at, updated_at
└── relationships: User, OrderItems, DeliveryTask

OrderItem
├── id, order_id, product_id, quantity
├── unit_price, subtotal
└── relationships: Order, Product
```

**Delivery & Riders:**
```
Rider
├── id, name, phone, vehicle_type
├── rating, total_deliveries, status
└── relationships: User, DeliveryTasks

DeliveryTask
├── id, order_id, rider_id, status
├── pickup_address, delivery_address, location
├── estimated_delivery, actual_delivery
└── relationships: Order, Rider
```

**Payments:**
```
Payment
├── id, order_id, amount, payment_method
├── status, transaction_id
├── created_at, confirmed_at
└── relationships: Order
```

**Support & Feedback:**
```
SupportTicket
├── id, user_id, subject, description
├── status, priority, assigned_to
└── relationships: User, Replies

Feedback
├── id, user_id, rating, message
├── type, status
└── relationships: User
```

**Marketing:**
```
Campaign
├── id, name, description, status
├── start_date, end_date, budget
└── relationships: Contacts

Contact
├── id, email, phone, name
├── tags, created_at
└── relationships: User
```

---

## 📝 Implementation Order

### Priority 1 (Critical - Admin Dashboard Works)
```
Week 1, Days 1-5:
1. Orders (→ Orders page)
2. Products (→ Products page)
3. Dashboard stats (→ Dashboard page)
4. Inventory (→ Inventory page)
```

### Priority 2 (Important - Extended Functionality)
```
Week 2, Days 6-10:
5. Delivery & Riders (→ Delivery page)
6. Users (→ Users page)
7. Support (→ Support page)
8. Payments (→ Payments page)
9. Reports (→ Reports page)
```

### Priority 3 (Nice to Have)
```
Week 2+ (Phase 3+):
10. Marketing
11. Settings
12. Advanced analytics
```

---

## 🔐 Security Requirements

### All Endpoints Protected With:
```
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
```

### Audit Logging On:
```
Every POST, PATCH, DELETE operation
Track: user, resource, action, changes, IP
```

### Input Validation:
```
DTOs for all requests
class-validator decorators
Custom validators as needed
```

---

## 📊 Response Format (Consistent)

### List Endpoint
```typescript
{
  statusCode: 200,
  message: "Success",
  data: [...],
  pagination: {
    total: 100,
    page: 1,
    limit: 20,
    pages: 5
  }
}
```

### Single Resource
```typescript
{
  statusCode: 200,
  message: "Success",
  data: { id, name, ... }
}
```

### Error Response
```typescript
{
  statusCode: 400,
  message: "Validation failed",
  errors: [{ field, message }]
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- Service methods (create, update, delete, find)
- Business logic validation
- Error handling

### Controller Tests
- Endpoint routing
- Request/response format
- Status codes
- Authorization checks

### E2E Tests
- Full workflows (create order → confirm payment → assign rider)
- User role restrictions
- Error scenarios

### Coverage Target
```
Services:    >85%
Controllers: >75%
Overall:     >80%
```

---

## 📚 Documentation Needed

For each endpoint:
```
1. What it does
2. Who can access (role required)
3. Request format (body/params/query)
4. Response format
5. Error cases
6. Example cURL command
7. Audit logging (what gets logged)
```

---

## 🎯 Daily Breakdown

### Week 1

**Monday (Aug 11):**
- Order entity & migration
- Order service (CRUD)
- Order controller

**Tuesday (Aug 12):**
- Dashboard stats endpoints
- Product service (CRUD)
- Product controller

**Wednesday (Aug 13):**
- Category service & controller
- Inventory service & controller
- Tests for all above

**Thursday (Aug 14):**
- Payment service & controller
- Payment tests
- Integration testing

**Friday (Aug 15):**
- Fix issues from Week 1
- Prepare for Week 2
- Review & plan

### Week 2

**Monday (Aug 18):**
- Rider entity & migration
- DeliveryTask entity
- Rider & Delivery services

**Tuesday (Aug 19):**
- Rider & Delivery controllers
- Delivery tracking
- Tests

**Wednesday (Aug 20):**
- User management endpoints
- Support ticket system
- Tests

**Thursday (Aug 21):**
- Feedback system
- Marketing endpoints
- Reports endpoints

**Friday (Aug 22):**
- Settings endpoints
- Complete all tests
- Documentation

---

## 🚀 Expected Outcomes

### By End of Week 1
```
✅ Users can view dashboard with real data
✅ Orders CRUD fully working
✅ Products & Inventory management working
✅ 28 endpoints tested
✅ 80%+ coverage on critical paths
```

### By End of Week 2
```
✅ Complete admin dashboard fully functional
✅ All 56 endpoints implemented
✅ Delivery & rider tracking working
✅ User & support management working
✅ Reports & analytics available
✅ 80%+ overall test coverage
✅ Complete API documentation
```

---

## 📊 Database Migration Schedule

```
Day 1:  CreateOrdersTable, CreateOrderItemsTable
Day 2:  CreatePaymentsTable
Day 4:  CreateDeliveryTablesTable, CreateRidersTable
Day 6:  CreateSupportTicketsTable, CreateFeedbackTable
Day 8:  CreateCampaignsTable, CreateContactsTable
```

---

## 🔄 How This Aligns with UI

### Admin Dashboard Page → API Endpoint
```
Dashboard
  ├── Stats cards      → GET /admin/dashboard/stats
  ├── Charts           → GET /admin/dashboard/charts
  └── Tables           → GET /admin/orders (latest)

Orders Page
  ├── Table of orders  → GET /admin/orders
  ├── Order details    → GET /admin/orders/:id
  └── Status update    → PATCH /admin/orders/:id/status

Products Page
  ├── Product list     → GET /admin/products
  ├── Add product      → POST /admin/products
  ├── Edit product     → PATCH /admin/products/:id
  └── Delete product   → DELETE /admin/products/:id

Delivery Page
  ├── Tasks list       → GET /admin/delivery/tasks
  ├── Rider tracking   → GET /admin/delivery/tracking
  └── Assign rider     → PATCH /admin/orders/:id/assign-rider

(And so on for each page...)
```

---

## 📋 File Structure You'll Create

```
src/
├── orders/
│   ├── controllers/order.controller.ts
│   ├── services/order.service.ts
│   ├── entities/order.entity.ts
│   ├── entities/order-item.entity.ts
│   ├── dtos/
│   └── orders.module.ts
│
├── products/
│   ├── controllers/product.controller.ts
│   ├── services/product.service.ts
│   ├── entities/product.entity.ts (update)
│   ├── dtos/
│   └── products.module.ts
│
├── inventory/
│   ├── services/inventory.service.ts
│   ├── controllers/inventory.controller.ts
│   ├── dtos/
│   └── inventory.module.ts
│
├── delivery/
│   ├── entities/delivery-task.entity.ts
│   ├── entities/rider.entity.ts
│   ├── services/delivery.service.ts
│   ├── controllers/delivery.controller.ts
│   ├── dtos/
│   └── delivery.module.ts
│
├── payments/
│   ├── entities/payment.entity.ts
│   ├── services/payment.service.ts
│   ├── controllers/payment.controller.ts
│   ├── dtos/
│   └── payments.module.ts
│
├── support/
│   ├── entities/support-ticket.entity.ts
│   ├── entities/feedback.entity.ts
│   ├── services/support.service.ts
│   ├── controllers/support.controller.ts
│   ├── dtos/
│   └── support.module.ts
│
├── dashboard/
│   ├── services/dashboard.service.ts
│   ├── controllers/dashboard.controller.ts
│   └── dashboard.module.ts
│
├── reports/
│   ├── services/reports.service.ts
│   ├── controllers/reports.controller.ts
│   └── reports.module.ts
│
└── marketing/
    ├── entities/campaign.entity.ts
    ├── entities/contact.entity.ts
    ├── services/marketing.service.ts
    ├── controllers/marketing.controller.ts
    ├── dtos/
    └── marketing.module.ts

Total: 40-50 new files
```

---

## ✨ Key Advantages of This Approach

1. **UI-Driven:** Every endpoint solves a real UI need
2. **Practical:** Focus on business logic, not admin operations
3. **Complete:** Admin dashboard fully functional by Week 2
4. **Testable:** Clear workflows to test
5. **Maintainable:** Business domains are easy to understand
6. **Scalable:** Easy to extend with more features

---

## 🎉 Expected Deliverable

By end of Phase 2, you will have:

```
✅ Complete Shago Admin Dashboard API
✅ 56 endpoints across 8 business domains
✅ Real-time data for all dashboard pages
✅ Full CRUD operations on products, orders, users
✅ Delivery tracking system
✅ Payment management
✅ Support ticket system
✅ Reports & analytics
✅ 80%+ test coverage
✅ Complete API documentation
✅ Production-ready code
```

---

## 🚀 Ready to Build?

This Phase 2 plan focuses on **real business value** for the admin dashboard.

Every endpoint, every entity, every feature serves a purpose in the admin UI.

**Let's build something users will actually use!** 💪

---

**Phase 2 Status:** ✅ **Refocused & Ready**  
**Endpoints:** 56 across 8 domains  
**Duration:** 2 weeks  
**Start Date:** August 10, 2026
