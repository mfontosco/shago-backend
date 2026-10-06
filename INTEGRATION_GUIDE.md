# 🍕 Shago Platform - Complete Integration Guide

## Overview

This guide provides integration instructions for all three Shago apps:
- **Mobile App** (Customer/User facing)
- **Main App** (Vendor Dashboard)
- **Rider App** (Delivery Riders)

---

## 🔐 Authentication Flow

### 1. Base URL
```
Production: https://api.shago.app/api/v1
Development: http://localhost:3000/api/v1
```

### 2. Authentication Endpoints

#### User Registration & Login
```
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh-token
```

#### Response Format
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "customer|vendor|rider",
      "tenant_id": "uuid"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

### 3. JWT Token Usage
All authenticated requests must include:
```
Authorization: Bearer {jwt_token}
```

The JWT token contains:
- `sub`: User ID
- `email`: User email
- `role`: User role (customer, vendor, rider)
- `tenant_id`: Multi-tenancy identifier
- `iat`: Issued at
- `exp`: Expiration time

---

## 📱 Mobile App Integration

### Target Users
- **Customers/Users** who order food
- **Delivery customers** who track deliveries

### Key Features
- Browse restaurants/vendors
- Search products
- Place orders
- Track deliveries
- Make payments
- Rate orders & feedback
- Contact support

### API Endpoints Structure

#### Authentication
```
POST /auth/register         (Create customer account)
POST /auth/login            (Customer login)
POST /auth/logout           (Customer logout)
POST /auth/refresh-token    (Refresh JWT)
```

#### Products & Catalog
```
GET /public/products        (Browse all products)
GET /public/products/:id    (Product details)
GET /public/categories      (Browse categories)
GET /public/vendors         (Browse vendors)
GET /public/vendors/:id     (Vendor details)
GET /public/search          (Search products)
```

#### Orders
```
POST /orders                (Place new order)
GET /orders                 (List customer's orders)
GET /orders/:id             (Order details)
PATCH /orders/:id           (Track order status)
```

#### Payments
```
POST /payments/initialize-paystack    (Start Paystack payment)
POST /payments/initialize-flutterwave (Start Flutterwave payment)
POST /payments/verify/:reference      (Verify payment completion)
GET /orders/:id/payment                (Get order payment status)
```

#### Deliveries
```
GET /deliveries/:orderId    (Track delivery location)
GET /deliveries/:id         (Delivery details)
PATCH /deliveries/:id/status (Update delivery status)
```

#### Support
```
POST /support/tickets       (Create support ticket)
GET /support/tickets        (List customer's tickets)
GET /support/tickets/:id    (Ticket details)

POST /support/feedback      (Submit feedback/rating)
GET /support/feedback       (List customer's feedback)
```

#### Account
```
GET /users/profile          (Get profile)
PATCH /users/profile        (Update profile)
GET /users/addresses        (Saved addresses)
POST /users/addresses       (Add address)
```

#### Promotions
```
GET /public/promotions      (Active promotions)
GET /public/promotions/:id  (Promotion details)
POST /orders/apply-promo    (Apply promotion to order)
```

---

## 🏢 Main App Integration (Vendor Dashboard)

### Target Users
- **Vendors/Restaurant Owners**
- **Admin users** managing the business

### Key Features
- Manage products & inventory
- Process orders
- Manage deliveries
- View payments & analytics
- Support ticket management
- Create promotions/campaigns
- Business analytics

### API Endpoints Structure

#### Authentication
```
POST /auth/login            (Vendor login)
POST /auth/logout           (Vendor logout)
```

#### Dashboard & Analytics
```
GET /vendor/dashboard       (Dashboard overview)
GET /vendor/analytics       (Sales analytics)
GET /vendor/reports         (Custom reports)
```

#### Products Management
```
POST /vendor/products       (Create product)
GET /vendor/products        (List products)
GET /vendor/products/:id    (Product details)
PATCH /vendor/products/:id  (Update product)
DELETE /vendor/products/:id (Delete product)
POST /vendor/products/:id/upload-image (Product image)
```

#### Orders Management
```
GET /vendor/orders          (All orders)
GET /vendor/orders/:id      (Order details)
PATCH /vendor/orders/:id/status (Update order status)
GET /vendor/orders/stats    (Order statistics)
```

#### Payment Management
```
GET /vendor/payments        (All payments)
GET /vendor/payments/:id    (Payment details)
PATCH /vendor/payments/:id  (Update payment status)
POST /vendor/payments/:id/refund (Process refund)
GET /vendor/payments/summary (Payment statistics)
```

#### Deliveries Management
```
GET /vendor/deliveries      (All deliveries)
GET /vendor/deliveries/:id  (Delivery details)
PATCH /vendor/deliveries/:id/status (Update status)
POST /vendor/deliveries/assign (Assign to rider)
```

#### Support Management
```
GET /vendor/support/tickets (Support tickets)
GET /vendor/support/tickets/:id
PATCH /vendor/support/tickets/:id (Update ticket status)

GET /vendor/support/feedback (Customer feedback)
GET /vendor/support/feedback/:id
PATCH /vendor/support/feedback/:id (Acknowledge feedback)
```

#### Marketing & Promotions
```
POST /vendor/marketing/promotions (Create promotion)
GET /vendor/marketing/promotions  (List promotions)
GET /vendor/marketing/promotions/:id
PATCH /vendor/marketing/promotions/:id (Update promotion)
DELETE /vendor/marketing/promotions/:id

POST /vendor/marketing/messages (Send bulk message)
GET /vendor/marketing/campaigns (View campaigns)
```

#### Categories Management
```
POST /vendor/categories     (Create category)
GET /vendor/categories      (List categories)
PATCH /vendor/categories/:id (Update category)
DELETE /vendor/categories/:id (Delete category)
```

---

## 🚴 Rider App Integration

### Target Users
- **Delivery Riders**
- **Logistics partners**

### Key Features
- View assigned deliveries
- Update delivery status
- Track routes & directions
- Contact customers/vendors
- Earnings tracking
- Rate customers
- Delivery proof upload

### API Endpoints Structure

#### Authentication
```
POST /auth/login            (Rider login)
POST /auth/logout           (Rider logout)
```

#### Deliveries Management
```
GET /rider/deliveries       (Assigned deliveries)
GET /rider/deliveries/:id   (Delivery details)
PATCH /rider/deliveries/:id/status (Update status)
POST /rider/deliveries/:id/upload-proof (Proof of delivery)
GET /rider/deliveries/:id/directions (Get directions)
```

#### Route Optimization
```
POST /rider/deliveries/optimize-route (Optimize delivery route)
GET /rider/deliveries/nearby (Find nearby deliveries)
```

#### Location & Tracking
```
POST /rider/location        (Update current location)
GET /rider/location/:deliveryId (Delivery tracking)
```

#### Communication
```
POST /rider/contact/:customerId (Message customer)
POST /rider/contact/:vendorId (Message vendor)
GET /rider/messages         (Conversation history)
```

#### Earnings & Performance
```
GET /rider/earnings         (Daily/weekly earnings)
GET /rider/statistics       (Performance stats)
GET /rider/ratings          (Customer ratings)
```

#### Account
```
GET /rider/profile          (Profile info)
PATCH /rider/profile        (Update profile)
POST /rider/documents       (Upload verification docs)
GET /rider/wallet           (Wallet balance)
```

---

## 📊 Data Models & Examples

### Order Object
```json
{
  "id": "uuid",
  "order_number": "ORD-20260823-001",
  "customer_id": "uuid",
  "vendor_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 12.99,
      "total": 25.98
    }
  ],
  "subtotal": 45.99,
  "tax": 3.60,
  "delivery_fee": 5.00,
  "discount": 0,
  "total_amount": 54.59,
  "status": "pending|accepted|preparing|ready|picked_up|delivered",
  "payment_status": "pending|completed|failed",
  "delivery_address": "123 Main St, New York",
  "created_at": "2026-08-23T21:00:00Z",
  "estimated_delivery": "2026-08-23T21:45:00Z"
}
```

### Delivery Object
```json
{
  "id": "uuid",
  "order_id": "uuid",
  "rider_id": "uuid",
  "status": "pending|assigned|picked_up|on_way|delivered",
  "current_latitude": 40.7128,
  "current_longitude": -74.0060,
  "delivery_address": "123 Main St",
  "estimated_delivery": "2026-08-23T21:45:00Z",
  "delivery_time": "2026-08-23T21:42:00Z",
  "rating": 5,
  "created_at": "2026-08-23T21:00:00Z"
}
```

### Payment Object
```json
{
  "id": "uuid",
  "order_id": "uuid",
  "amount": 54.59,
  "currency": "USD",
  "payment_method": "card|bank_transfer|wallet|cash",
  "payment_status": "pending|completed|failed|refunded",
  "transaction_reference": "TXN-20260823-12345",
  "payment_gateway": "paystack|flutterwave",
  "created_at": "2026-08-23T21:00:00Z"
}
```

---

## 🔄 Integration Workflows

### 1. Mobile App - Order Placement Workflow
```
1. User browses products
   GET /public/products
   GET /public/categories

2. User adds items to cart (client-side)

3. User places order
   POST /orders
   {
     "items": [{"product_id": "...", "quantity": 2}],
     "delivery_address": "...",
     "customer_phone": "..."
   }

4. Initiate payment
   POST /payments/initialize-paystack
   {
     "order_id": "...",
     "amount": 54.59,
     "email": "customer@example.com"
   }

5. Customer completes payment on gateway

6. Verify payment
   POST /payments/verify/txn_reference

7. Track order
   GET /orders/:id
   GET /deliveries/:orderId

8. Rate order after delivery
   POST /support/feedback
   {
     "order_id": "...",
     "rating": 5,
     "feedback_text": "Great food!"
   }
```

### 2. Vendor Dashboard - Order Processing Workflow
```
1. Vendor logs in
   POST /auth/login

2. View dashboard
   GET /vendor/dashboard

3. Accept/reject orders
   PATCH /vendor/orders/:id/status (accepted|rejected)

4. View order details
   GET /vendor/orders/:id

5. Update order status (preparing → ready)
   PATCH /vendor/orders/:id/status

6. Assign to rider
   POST /vendor/deliveries/assign
   {
     "order_id": "...",
     "rider_id": "..."
   }

7. Track delivery
   GET /vendor/deliveries/:id

8. View payments
   GET /vendor/payments
   GET /vendor/payments/summary

9. Create promotions
   POST /vendor/marketing/promotions
   {
     "title": "...",
     "discount_value": 20,
     "promo_type": "discount"
   }
```

### 3. Rider App - Delivery Workflow
```
1. Rider logs in
   POST /auth/login

2. View assigned deliveries
   GET /rider/deliveries

3. Accept delivery
   PATCH /rider/deliveries/:id/status (assigned)

4. Update location
   POST /rider/location
   {
     "latitude": 40.7128,
     "longitude": -74.0060
   }

5. Mark picked up
   PATCH /rider/deliveries/:id/status (picked_up)

6. On the way
   PATCH /rider/deliveries/:id/status (on_way)

7. Take proof photo
   POST /rider/deliveries/:id/upload-proof

8. Mark delivered
   PATCH /rider/deliveries/:id/status (delivered)

9. View earnings
   GET /rider/earnings

10. View ratings
    GET /rider/ratings
```

---

## 🛠️ Error Handling

### Common Error Responses

#### 401 - Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized - Invalid or expired token",
  "timestamp": "2026-08-23T21:00:00Z"
}
```

#### 403 - Forbidden (Multi-tenancy violation)
```json
{
  "statusCode": 403,
  "message": "Access denied - You don't have permission to access this resource",
  "timestamp": "2026-08-23T21:00:00Z"
}
```

#### 404 - Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "timestamp": "2026-08-23T21:00:00Z"
}
```

#### 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid request data",
  "errors": {
    "email": ["Invalid email format"],
    "amount": ["Amount must be greater than 0"]
  },
  "timestamp": "2026-08-23T21:00:00Z"
}
```

---

## 📝 Rate Limiting & Best Practices

### Rate Limits
```
- Unauthenticated: 60 requests/hour
- Authenticated: 1000 requests/hour
- Payment endpoints: 50 requests/hour
```

### Best Practices
1. **Caching**: Cache product listings, categories for 5 minutes
2. **Pagination**: Always use pagination for list endpoints (default: 20 items)
3. **Retry Logic**: Implement exponential backoff for failed requests
4. **Error Handling**: Always handle error responses gracefully
5. **Timeout**: Set 30-second timeout for API calls
6. **Offline Support**: Implement offline-first architecture for mobile app

---

## 🔒 Security

### HTTPS Required
All production requests must use HTTPS

### Token Security
- Store JWT tokens securely (secure storage on mobile)
- Refresh tokens every hour
- Clear tokens on logout
- Never expose tokens in logs

### Data Protection
- Validate all user inputs
- Don't transmit sensitive data in query params
- Use POST for sensitive operations
- Implement request signing for critical operations

---

## 📞 Support & Documentation

**API Documentation**: `http://localhost:3000/api/docs`
**GitHub Issues**: Report bugs and feature requests
**Email**: support@shago.app

---

## 🚀 Getting Started

### Mobile App Setup
```bash
# Install SDK
npm install shago-sdk

# Initialize
const ShagoClient = require('shago-sdk');
const client = new ShagoClient({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 30000
});

# Login
const response = await client.auth.login({
  email: 'customer@example.com',
  password: 'password'
});

# Place order
const order = await client.orders.create({
  items: [...],
  delivery_address: '...'
});
```

### Vendor Dashboard Setup
```bash
# Install SDK
npm install shago-dashboard-sdk

# Initialize
const ShagoVendor = require('shago-dashboard-sdk');
const vendor = new ShagoVendor({
  baseURL: 'http://localhost:3000/api/v1'
});

# Login
const response = await vendor.auth.login({
  email: 'vendor@example.com',
  password: 'password'
});

# Get dashboard
const dashboard = await vendor.dashboard.get();
```

### Rider App Setup
```bash
# Install SDK
npm install shago-rider-sdk

# Initialize
const ShagoRider = require('shago-rider-sdk');
const rider = new ShagoRider({
  baseURL: 'http://localhost:3000/api/v1'
});

# Login
const response = await rider.auth.login({
  email: 'rider@example.com',
  password: 'password'
});

# Get deliveries
const deliveries = await rider.deliveries.list();
```

---

Last Updated: August 23, 2026
Version: 1.0.0
