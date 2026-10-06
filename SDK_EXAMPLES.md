# 🚀 Shago SDK Examples - Mobile, Vendor & Rider Apps

## Installation

### NPM/Yarn
```bash
npm install shago-sdk
# or
yarn add shago-sdk
```

### Configuration
```typescript
import { ShagoClient } from 'shago-sdk';

const client = new ShagoClient({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 30000,
  retryAttempts: 3
});
```

---

# 📱 MOBILE APP (Customer)

## 1. Authentication

### Register
```typescript
const registerUser = async () => {
  try {
    const response = await client.auth.register({
      email: 'customer@example.com',
      password: 'securePassword123',
      fullName: 'John Doe'
    });
    
    // Store token securely
    localStorage.setItem('auth_token', response.data.token);
    return response.data.user;
  } catch (error) {
    console.error('Registration failed:', error.message);
  }
};
```

### Login
```typescript
const loginUser = async () => {
  try {
    const response = await client.auth.login({
      email: 'customer@example.com',
      password: 'securePassword123'
    });
    
    // Store token & user info
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.message);
  }
};
```

### Logout
```typescript
const logoutUser = async () => {
  try {
    await client.auth.logout();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Logout failed:', error.message);
  }
};
```

---

## 2. Browse Products

### Get All Products
```typescript
const getProducts = async (page = 1, limit = 20) => {
  try {
    const response = await client.products.list({
      page,
      limit,
      search: '', // optional
      category_id: '', // optional
      vendor_id: '' // optional
    });
    
    return {
      products: response.data,
      total: response.total,
      pages: response.pages
    };
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }
};
```

### Search Products
```typescript
const searchProducts = async (query) => {
  try {
    const response = await client.products.search({
      query,
      page: 1,
      limit: 20
    });
    
    return response.data;
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

### Get Product Details
```typescript
const getProductDetails = async (productId) => {
  try {
    const response = await client.products.getById(productId);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch product:', error);
  }
};
```

### Get Categories
```typescript
const getCategories = async () => {
  try {
    const response = await client.categories.list();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
};
```

---

## 3. Place Orders

### Create Order
```typescript
const placeOrder = async (orderData) => {
  try {
    const response = await client.orders.create({
      items: [
        {
          product_id: 'uuid-1',
          quantity: 2,
          price: 12.99
        },
        {
          product_id: 'uuid-2',
          quantity: 1,
          price: 8.99
        }
      ],
      delivery_address: '123 Main St, New York, NY 10001',
      customer_phone: '+1234567890',
      special_instructions: 'No onions, extra cheese',
      promo_code: 'SUMMER20' // optional
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to place order:', error);
  }
};
```

### Get Customer Orders
```typescript
const getMyOrders = async (page = 1) => {
  try {
    const response = await client.orders.list({
      page,
      limit: 10
    });
    
    return {
      orders: response.data,
      total: response.total,
      pages: response.pages
    };
  } catch (error) {
    console.error('Failed to fetch orders:', error);
  }
};
```

### Track Order
```typescript
const trackOrder = async (orderId) => {
  try {
    const response = await client.orders.getById(orderId);
    
    return {
      order: response.data,
      status: response.data.status,
      estimated_delivery: response.data.estimated_delivery,
      delivery: response.data.delivery
    };
  } catch (error) {
    console.error('Failed to track order:', error);
  }
};
```

---

## 4. Payment Processing

### Initialize Paystack Payment
```typescript
const initializePaystackPayment = async (orderId) => {
  try {
    const response = await client.payments.initializePaystack({
      order_id: orderId,
      email: 'customer@example.com',
      amount: 54.59
    });
    
    // Redirect user to Paystack
    window.location.href = response.data.authorization_url;
  } catch (error) {
    console.error('Failed to initialize payment:', error);
  }
};
```

### Verify Payment
```typescript
const verifyPayment = async (reference) => {
  try {
    const response = await client.payments.verify({
      reference
    });
    
    if (response.data.status === 'success') {
      console.log('Payment successful!');
      return true;
    } else {
      console.log('Payment failed');
      return false;
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    return false;
  }
};
```

### Initialize Flutterwave Payment
```typescript
const initializeFlutterwavePayment = async (orderId) => {
  try {
    const response = await client.payments.initializeFlutterwave({
      order_id: orderId,
      email: 'customer@example.com',
      amount: 54.59,
      payment_option: 'card' // or 'mobile_money'
    });
    
    // Redirect to Flutterwave
    window.location.href = response.data.link;
  } catch (error) {
    console.error('Failed to initialize payment:', error);
  }
};
```

---

## 5. Track Delivery

### Get Delivery Status
```typescript
const getDeliveryStatus = async (orderId) => {
  try {
    const response = await client.deliveries.getByOrder(orderId);
    
    return {
      status: response.data.status, // pending, assigned, picked_up, on_way, delivered
      rider_name: response.data.rider?.fullName,
      rider_phone: response.data.rider?.phone,
      current_location: {
        latitude: response.data.current_latitude,
        longitude: response.data.current_longitude
      },
      estimated_delivery: response.data.estimated_delivery
    };
  } catch (error) {
    console.error('Failed to get delivery status:', error);
  }
};
```

---

## 6. Support & Feedback

### Create Support Ticket
```typescript
const createSupportTicket = async () => {
  try {
    const response = await client.support.createTicket({
      subject: 'Order not delivered',
      message: 'I haven\'t received my order after 2 hours',
      priority: 'high',
      issue_category: 'delivery',
      order_id: 'uuid'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to create ticket:', error);
  }
};
```

### Submit Feedback
```typescript
const submitFeedback = async (orderId, rating, feedback) => {
  try {
    const response = await client.support.createFeedback({
      order_id: orderId,
      rating: rating, // 1-5 stars
      feedback_text: feedback,
      issue_category: 'service' // or 'quality', 'delivery', 'pricing'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to submit feedback:', error);
  }
};
```

### List My Support Tickets
```typescript
const getMyTickets = async () => {
  try {
    const response = await client.support.listTickets({
      page: 1,
      limit: 20
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
  }
};
```

---

## 7. View Promotions

### Get Active Promotions
```typescript
const getPromotions = async () => {
  try {
    const response = await client.promotions.list();
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch promotions:', error);
  }
};
```

### Apply Promo Code
```typescript
const applyPromoCode = async (orderId, promoCode) => {
  try {
    const response = await client.orders.applyPromotion({
      order_id: orderId,
      promo_code: promoCode
    });
    
    return {
      discount: response.data.discount,
      new_total: response.data.new_total
    };
  } catch (error) {
    console.error('Failed to apply promo code:', error);
  }
};
```

---

---

# 🏢 VENDOR DASHBOARD (Main App)

## 1. Authentication

### Vendor Login
```typescript
const vendorLogin = async () => {
  try {
    const response = await client.auth.login({
      email: 'vendor@restaurant.com',
      password: 'securePassword123',
      user_type: 'vendor'
    });
    
    localStorage.setItem('vendor_token', response.data.token);
    return response.data;
  } catch (error) {
    console.error('Vendor login failed:', error);
  }
};
```

---

## 2. Dashboard Overview

### Get Dashboard Data
```typescript
const getDashboard = async () => {
  try {
    const response = await client.vendor.dashboard.get();
    
    return {
      total_orders_today: response.data.total_orders_today,
      total_revenue_today: response.data.total_revenue_today,
      pending_orders: response.data.pending_orders,
      active_deliveries: response.data.active_deliveries,
      customer_satisfaction: response.data.customer_satisfaction,
      top_products: response.data.top_products
    };
  } catch (error) {
    console.error('Failed to fetch dashboard:', error);
  }
};
```

---

## 3. Product Management

### Create Product
```typescript
const createProduct = async (productData) => {
  try {
    const response = await client.vendor.products.create({
      name: 'Margherita Pizza',
      description: 'Fresh mozzarella, basil, and tomato sauce',
      price: 12.99,
      category_id: 'uuid',
      image_url: 'https://example.com/pizza.jpg',
      in_stock: true,
      preparation_time: 15 // minutes
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to create product:', error);
  }
};
```

### Update Product
```typescript
const updateProduct = async (productId, updates) => {
  try {
    const response = await client.vendor.products.update(productId, {
      name: 'Updated Product Name',
      price: 13.99,
      in_stock: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to update product:', error);
  }
};
```

### Get All Products
```typescript
const getVendorProducts = async () => {
  try {
    const response = await client.vendor.products.list({
      page: 1,
      limit: 50
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }
};
```

### Delete Product
```typescript
const deleteProduct = async (productId) => {
  try {
    await client.vendor.products.delete(productId);
    return true;
  } catch (error) {
    console.error('Failed to delete product:', error);
    return false;
  }
};
```

---

## 4. Order Management

### Get All Orders
```typescript
const getVendorOrders = async (status = 'all') => {
  try {
    const response = await client.vendor.orders.list({
      status: status, // all, pending, accepted, preparing, ready, picked_up, delivered
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
    
    return {
      orders: response.data,
      total: response.total
    };
  } catch (error) {
    console.error('Failed to fetch orders:', error);
  }
};
```

### Accept Order
```typescript
const acceptOrder = async (orderId) => {
  try {
    const response = await client.vendor.orders.update(orderId, {
      status: 'accepted'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to accept order:', error);
  }
};
```

### Prepare Order
```typescript
const prepareOrder = async (orderId) => {
  try {
    const response = await client.vendor.orders.update(orderId, {
      status: 'preparing'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to update order:', error);
  }
};
```

### Mark Order Ready
```typescript
const markOrderReady = async (orderId) => {
  try {
    const response = await client.vendor.orders.update(orderId, {
      status: 'ready'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to mark order ready:', error);
  }
};
```

---

## 5. Payment Management

### Get Payments
```typescript
const getPayments = async () => {
  try {
    const response = await client.vendor.payments.list({
      page: 1,
      limit: 20,
      sort_by: 'created_at'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch payments:', error);
  }
};
```

### Get Payment Statistics
```typescript
const getPaymentStats = async () => {
  try {
    const response = await client.vendor.payments.getSummary();
    
    return {
      total_revenue: response.data.total_revenue,
      total_transactions: response.data.total_transactions,
      pending_payments: response.data.pending_payments,
      failed_payments: response.data.failed_payments,
      completion_rate: response.data.completion_rate
    };
  } catch (error) {
    console.error('Failed to fetch payment stats:', error);
  }
};
```

### Process Refund
```typescript
const refundPayment = async (paymentId, amount) => {
  try {
    const response = await client.vendor.payments.refund(paymentId, {
      amount: amount // optional, full refund if omitted
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to process refund:', error);
  }
};
```

---

## 6. Support Management

### Get Support Tickets
```typescript
const getSupportTickets = async () => {
  try {
    const response = await client.vendor.support.listTickets({
      page: 1,
      limit: 20,
      status: 'all' // all, pending, in_progress, resolved, closed
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
  }
};
```

### Update Ticket Status
```typescript
const updateTicketStatus = async (ticketId, status) => {
  try {
    const response = await client.vendor.support.updateTicket(ticketId, {
      status: status // pending, in_progress, resolved, closed
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to update ticket:', error);
  }
};
```

---

## 7. Marketing & Promotions

### Create Promotion
```typescript
const createPromotion = async () => {
  try {
    const response = await client.vendor.marketing.createPromotion({
      title: 'Summer Special',
      description: 'Get 30% off on pizzas',
      discount_value: 30,
      promo_type: 'discount', // discount, free_shipping, buy_one_get_one
      start_date: '2026-09-01T00:00:00Z',
      end_date: '2026-09-30T23:59:59Z',
      status: 'active',
      recipients_count: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to create promotion:', error);
  }
};
```

### Send Bulk Message
```typescript
const sendBulkMessage = async () => {
  try {
    const response = await client.vendor.marketing.sendMessage({
      recipients: ['customer1@example.com', 'customer2@example.com'],
      title: 'New Menu Items Available',
      message: 'Check out our new vegan pizza options!'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};
```

---

---

# 🚴 RIDER APP

## 1. Authentication

### Rider Login
```typescript
const riderLogin = async () => {
  try {
    const response = await client.auth.login({
      email: 'rider@shago.com',
      password: 'password123',
      user_type: 'rider'
    });
    
    localStorage.setItem('rider_token', response.data.token);
    return response.data;
  } catch (error) {
    console.error('Rider login failed:', error);
  }
};
```

---

## 2. Deliveries Management

### Get Assigned Deliveries
```typescript
const getMyDeliveries = async () => {
  try {
    const response = await client.rider.deliveries.list({
      status: 'assigned', // assigned, picked_up, on_way, delivered
      page: 1,
      limit: 20
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch deliveries:', error);
  }
};
```

### Accept Delivery
```typescript
const acceptDelivery = async (deliveryId) => {
  try {
    const response = await client.rider.deliveries.update(deliveryId, {
      status: 'assigned'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to accept delivery:', error);
  }
};
```

### Mark Picked Up
```typescript
const markPickedUp = async (deliveryId) => {
  try {
    const response = await client.rider.deliveries.update(deliveryId, {
      status: 'picked_up'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to mark picked up:', error);
  }
};
```

### Mark On The Way
```typescript
const markOnTheWay = async (deliveryId) => {
  try {
    const response = await client.rider.deliveries.update(deliveryId, {
      status: 'on_way'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to mark on the way:', error);
  }
};
```

### Mark Delivered
```typescript
const markDelivered = async (deliveryId) => {
  try {
    const response = await client.rider.deliveries.update(deliveryId, {
      status: 'delivered'
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to mark delivered:', error);
  }
};
```

---

## 3. Location Tracking

### Update Location
```typescript
const updateLocation = async (latitude, longitude) => {
  try {
    const response = await client.rider.location.update({
      latitude,
      longitude,
      accuracy: 10 // meters
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to update location:', error);
  }
};
```

---

## 4. Proof of Delivery

### Upload Delivery Proof
```typescript
const uploadDeliveryProof = async (deliveryId, photo) => {
  try {
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('timestamp', new Date().toISOString());
    
    const response = await client.rider.deliveries.uploadProof(
      deliveryId,
      formData
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to upload proof:', error);
  }
};
```

---

## 5. Earnings & Performance

### Get Daily Earnings
```typescript
const getDailyEarnings = async (date) => {
  try {
    const response = await client.rider.earnings.getDaily(date);
    
    return {
      total_earnings: response.data.total_earnings,
      total_deliveries: response.data.total_deliveries,
      average_rating: response.data.average_rating
    };
  } catch (error) {
    console.error('Failed to fetch earnings:', error);
  }
};
```

### Get Performance Stats
```typescript
const getPerformanceStats = async () => {
  try {
    const response = await client.rider.statistics.get();
    
    return {
      total_deliveries: response.data.total_deliveries,
      on_time_percentage: response.data.on_time_percentage,
      average_rating: response.data.average_rating,
      completion_rate: response.data.completion_rate
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};
```

---

## 6. Communication

### Send Message to Customer
```typescript
const messageCustomer = async (deliveryId, message) => {
  try {
    const response = await client.rider.messages.send({
      delivery_id: deliveryId,
      recipient_type: 'customer',
      message_text: message
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};
```

---

## Error Handling (All Apps)

```typescript
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('auth_token');
    redirectToLogin();
  } else if (error.response?.status === 403) {
    // Access denied
    showError('You don\'t have permission to perform this action');
  } else if (error.response?.status === 404) {
    // Not found
    showError('Resource not found');
  } else if (error.response?.status >= 500) {
    // Server error
    showError('Server error. Please try again later');
  } else {
    // Other errors
    showError(error.response?.data?.message || 'An error occurred');
  }
};
```

---

## Best Practices

1. **Always include error handling** for all API calls
2. **Store tokens securely** using secure storage
3. **Implement token refresh** automatically
4. **Use pagination** for list endpoints
5. **Cache responses** where appropriate (5-10 min TTL)
6. **Add retry logic** with exponential backoff
7. **Validate user input** before sending to API
8. **Show loading states** during API calls
9. **Handle network timeouts** gracefully
10. **Log errors** for debugging

---

Last Updated: August 23, 2026
Version: 1.0.0
