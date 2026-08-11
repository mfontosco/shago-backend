# Phase 2: Admin UI Alignment Map

**Purpose:** Map each admin dashboard page to required APIs  
**Status:** Ready to implement  
**Date:** August 10, 2026

---

## Admin Dashboard Pages → Required APIs

### 1️⃣ Dashboard Page (`/dashboard`)

**What the UI Shows:**
- Today's Sales, Visitors, Orders, Shipped (stat cards)
- Sales & Purchase chart (area chart)
- Top Selling Brands (pie chart)
- Low Stock Alert table
- Top Selling List table

**APIs Needed:**
```
GET /api/v1/admin/dashboard/stats
  Response: {
    today_sales: number,
    visitors: number,
    orders: number,
    shipped: number
  }

GET /api/v1/admin/dashboard/charts
  Response: {
    sales_purchase: { categories, sales_data, purchase_data },
    top_brands: { labels, data }
  }

GET /api/v1/admin/dashboard/low-stock
  Response: Array of products with low stock

GET /api/v1/admin/dashboard/top-selling
  Response: Array of top selling products
```

---

### 2️⃣ Orders Page (`/dashboard/orders`)

**What the UI Shows:**
- Table of orders (paginated)
- Columns: Product ID, Name, Average qty, Alert qty
- Filters by date, status
- Quick actions: View, Edit, Delete

**APIs Needed:**
```
GET /api/v1/admin/orders?page=1&limit=20
  Response: {
    data: [{ id, user, status, total, created_at }],
    pagination: { total, pages }
  }

GET /api/v1/admin/orders/:id
  Response: Full order details with items

GET /api/v1/admin/orders/:id/items
  Response: Order items with product details

PATCH /api/v1/admin/orders/:id/status
  Request: { status: 'pending|confirmed|delivered|cancelled' }
  Response: Updated order

PATCH /api/v1/admin/orders/:id/assign-rider
  Request: { rider_id: string }
  Response: Delivery task created

DELETE /api/v1/admin/orders/:id
  Response: Success (soft delete)
```

---

### 3️⃣ Products Page (`/dashboard/products`)

**What the UI Shows:**
- Product list table
- Columns: Product name, SKU, Category, Price, Stock
- Filters: Category, Status
- Actions: Add, Edit, Delete, View Details

**APIs Needed:**
```
GET /api/v1/admin/products?page=1&limit=20&category=1
  Response: {
    data: [{ id, name, sku, category, price, stock, status }],
    pagination: { total, pages }
  }

POST /api/v1/admin/products
  Request: { name, description, price, category_id, sku, stock }
  Response: Created product with id

GET /api/v1/admin/products/:id
  Response: Full product with variants, images, categories

PATCH /api/v1/admin/products/:id
  Request: { name?, description?, price?, stock?, status? }
  Response: Updated product

DELETE /api/v1/admin/products/:id
  Response: Success (soft delete)

GET /api/v1/admin/products/low-stock?threshold=10
  Response: Products below threshold
```

---

### 4️⃣ Product Categories Page (`/dashboard/product-categories`)

**What the UI Shows:**
- Category list
- Add/Edit category form
- Delete option

**APIs Needed:**
```
GET /api/v1/admin/categories
  Response: [{ id, name, description, product_count }]

POST /api/v1/admin/categories
  Request: { name, description }
  Response: Created category

GET /api/v1/admin/categories/:id
  Response: Category with products

PATCH /api/v1/admin/categories/:id
  Request: { name?, description? }
  Response: Updated category

DELETE /api/v1/admin/categories/:id
  Response: Success
```

---

### 5️⃣ Delivery Page (`/dashboard/delivery`)

**What the UI Shows:**
- Delivery tasks list
- Task status, assigned rider, location
- Real-time tracking map
- Rider details panel

**APIs Needed:**
```
GET /api/v1/admin/delivery/tasks?status=pending
  Response: [{ id, order_id, rider_id, status, location }]

GET /api/v1/admin/delivery/tasks/:id
  Response: Full task with order and rider details

PATCH /api/v1/admin/delivery/tasks/:id/status
  Request: { status: 'pending|in_transit|delivered' }
  Response: Updated task

GET /api/v1/admin/delivery/tracking/:task_id
  Response: { location: {lat, lng}, estimated_delivery }

GET /api/v1/admin/riders
  Response: [{ id, name, rating, deliveries, status }]

GET /api/v1/admin/riders/:id
  Response: Rider profile with performance metrics
```

---

### 6️⃣ Inventory Page (`/dashboard/inventory`)

**What the UI Shows:**
- Stock levels for all products
- Low stock alerts
- Import/Export functionality

**APIs Needed:**
```
GET /api/v1/admin/inventory?category=1
  Response: [{ product_id, name, current_stock, min_stock }]

GET /api/v1/admin/inventory/low-stock
  Response: Products below minimum stock

PATCH /api/v1/admin/inventory/:product_id
  Request: { quantity, action: 'add|remove|set' }
  Response: Updated inventory

POST /api/v1/admin/inventory/import
  Request: CSV file or JSON array
  Response: Import results { success, failed }
```

---

### 7️⃣ Payments Page (`/dashboard/payments`)

**What the UI Shows:**
- Payment transactions list
- Status, amount, method
- Confirmation status

**APIs Needed:**
```
GET /api/v1/admin/payments?page=1&limit=20
  Response: [{ id, order_id, amount, method, status, date }]

GET /api/v1/admin/payments/:id
  Response: Payment details with order info

PATCH /api/v1/admin/payments/:id/confirm
  Request: { confirmed: boolean }
  Response: Updated payment

GET /api/v1/admin/payments/stats
  Response: { total_revenue, total_pending, total_failed }
```

---

### 8️⃣ Users Page (`/dashboard/superadmin/users`)

**What the UI Shows:**
- User list table
- User details (name, email, phone, role)
- Filter/search

**APIs Needed:**
```
GET /api/v1/admin/users?page=1&limit=20&role=user
  Response: [{ id, email, name, phone, role, created_at, status }]

GET /api/v1/admin/users/:id
  Response: Full user profile with orders

PATCH /api/v1/admin/users/:id
  Request: { name?, email?, phone?, status? }
  Response: Updated user

POST /api/v1/admin/users/:id/suspend
  Request: { reason: string }
  Response: User suspended

DELETE /api/v1/admin/users/:id
  Response: Success (soft delete)
```

---

### 9️⃣ Reports Page (`/dashboard/reports`)

**What the UI Shows:**
- Sales reports with charts
- Date range filtering
- Export option

**APIs Needed:**
```
GET /api/v1/admin/reports/sales?date_from=2026-08-01&date_to=2026-08-10
  Response: { daily_data, total_sales, trend }

GET /api/v1/admin/reports/products
  Response: Top products, worst performers

GET /api/v1/admin/reports/revenue
  Response: Revenue analysis by category, date

GET /api/v1/admin/reports/export?format=csv
  Response: CSV download
```

---

### 🔟 Marketing Page (`/dashboard/marketings`)

**What the UI Shows:**
- Send messages to users
- Marketing campaigns
- Contact list management

**APIs Needed:**
```
GET /api/v1/admin/marketing/contacts
  Response: [{ id, email, phone, name, tags }]

POST /api/v1/admin/marketing/message
  Request: { recipient_ids[], subject, message }
  Response: Message queued

GET /api/v1/admin/marketing/campaigns
  Response: [{ id, name, status, reach }]

POST /api/v1/admin/marketing/campaigns
  Request: { name, message, start_date, end_date }
  Response: Created campaign
```

---

### 1️⃣1️⃣ Support & Feedback Page (`/dashboard/support&feedback`)

**What the UI Shows:**
- Support tickets list
- Ticket details and replies
- Feedback submission

**APIs Needed:**
```
GET /api/v1/admin/support/tickets?status=open
  Response: [{ id, user, subject, status, created_at }]

GET /api/v1/admin/support/tickets/:id
  Response: Ticket with all replies

PATCH /api/v1/admin/support/tickets/:id/status
  Request: { status: 'open|in_progress|resolved|closed' }
  Response: Updated ticket

POST /api/v1/admin/support/tickets/:id/reply
  Request: { message: string }
  Response: Reply created

GET /api/v1/admin/feedback
  Response: [{ id, user, rating, message, date }]
```

---

### 1️⃣2️⃣ Settings Page (Implied in UI)

**What the UI Needs:**
- System configuration
- Commission settings
- Delivery settings

**APIs Needed:**
```
GET /api/v1/admin/settings
  Response: All system settings

PATCH /api/v1/admin/settings/company
  Request: { name?, logo?, description? }
  Response: Updated settings

PATCH /api/v1/admin/settings/fees
  Request: { commission_percentage?, transaction_fee? }
  Response: Updated fees

PATCH /api/v1/admin/settings/delivery
  Request: { max_distance?, avg_time?, base_fee? }
  Response: Updated settings
```

---

## 📊 Complete API Matrix

| Page | Endpoints | Entities | Priority |
|------|-----------|----------|----------|
| Dashboard | 4 | Orders, Products | P1 |
| Orders | 6 | Order, OrderItem | P1 |
| Products | 6 | Product, Category | P1 |
| Categories | 4 | Category | P1 |
| Inventory | 4 | Product | P1 |
| Delivery | 6 | DeliveryTask, Rider | P2 |
| Payments | 4 | Payment, Order | P2 |
| Users | 5 | User | P2 |
| Reports | 4 | Order, Product | P2 |
| Marketing | 4 | Contact, Campaign | P3 |
| Support | 5 | Ticket, Feedback | P2 |
| Settings | 3 | SystemConfig | P3 |

**Total: 55+ Endpoints**

---

## 🎯 Implementation Priority

### Week 1 (P1 - Dashboard Works)
```
Days 1-2: Dashboard + Orders
Days 3-4: Products + Categories  
Day 5:    Inventory + Integration
```

### Week 2 (P2 - Full Operations)
```
Days 6-7: Delivery + Riders
Days 8-9: Payments + Users + Support
Day 10:   Reports + Settings
```

---

## 🔄 How to Build Each API

### Step 1: Create Entity
```typescript
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  user_id: string;
  
  // ... more columns
}
```

### Step 2: Create DTOs
```typescript
export class CreateOrderDto {
  @IsUUID()
  user_id: string;
  
  @IsString()
  delivery_address: string;
  
  // ... more fields
}
```

### Step 3: Create Service
```typescript
@Injectable()
export class OrderService {
  async create(dto: CreateOrderDto): Promise<Order> { ... }
  async findAll(): Promise<Order[]> { ... }
  async findOne(id: string): Promise<Order> { ... }
  async update(id: string, dto: UpdateOrderDto): Promise<Order> { ... }
  async delete(id: string): Promise<void> { ... }
}
```

### Step 4: Create Controller
```typescript
@Controller('admin/orders')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class OrderController {
  @Get()
  async findAll(@Query() query: PaginationDto) { ... }
  
  @Post()
  async create(@Body() dto: CreateOrderDto) { ... }
  
  // ... more endpoints
}
```

### Step 5: Test & Audit Log
- Write unit tests for service
- Write controller tests
- Add audit logging calls
- Test with cURL

---

## ✅ Success Checklist for Each Endpoint

- [ ] Entity created & migrated
- [ ] DTO created with validation
- [ ] Service method implemented
- [ ] Controller endpoint created
- [ ] Authorization guard applied (@Roles)
- [ ] Audit logging added (if mutation)
- [ ] Unit tests written (service)
- [ ] Controller tests written
- [ ] E2E test written
- [ ] Documented with example
- [ ] Tested with cURL manually

---

## 📝 Documentation Template

For each endpoint, document:

```
### GET /api/v1/admin/orders

**Purpose:** Retrieve list of orders

**Auth:** ADMIN, SUPER_ADMIN

**Query Parameters:**
- page (number, default: 1)
- limit (number, default: 20)
- status (string, optional)
- from_date (ISO date, optional)
- to_date (ISO date, optional)

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "status": "pending",
      "total": 1299.99,
      "created_at": "2026-08-10T12:34:56Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

**Error Cases:**
- 401: Unauthorized
- 403: Forbidden (insufficient role)
- 400: Invalid query parameters

**Example cURL:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/admin/orders?page=1&limit=20"
```

**Audit Logging:** No (read-only)
```

---

## 🚀 You Now Have

✅ **UI Alignment Map** - Every page mapped to APIs  
✅ **API Matrix** - 55+ endpoints across 12 pages  
✅ **Implementation Priority** - P1, P2, P3 order  
✅ **Build Pattern** - Entity → DTO → Service → Controller  
✅ **Checklist** - Verify each endpoint quality  
✅ **Documentation Template** - How to document  

---

## 🎉 Result

By end of Phase 2, you'll have built a **complete API** that powers the entire Shago Admin Dashboard.

Every endpoint solves a real problem in the UI.  
Every entity represents real business data.  
Every flow is tested and documented.  

**Real business value.** ✨

---

**Phase 2 is now:** ✅ **Fully Aligned with Admin UI**

Ready to start building? Pick any P1 endpoint and follow the pattern!
