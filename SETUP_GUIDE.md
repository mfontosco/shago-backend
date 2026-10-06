# 🚀 SHAGO BACKEND - SETUP GUIDE

## ✅ What You Have Now

1. ✅ `.env` file (local development configuration)
2. ✅ `.env.example` file (template with all possible settings)
3. ✅ 3 database migrations (ready to run)
4. ✅ All backend modules (Phase 2 complete)

---

## 📋 SETUP STEPS

### Step 1: Database Setup (PostgreSQL)

**Option A: Using PostgreSQL locally**
```bash
# 1. Install PostgreSQL from: https://www.postgresql.org/download/

# 2. Create database
createdb shago_db

# 3. Create user (if needed)
# In PostgreSQL shell:
CREATE USER postgres WITH PASSWORD 'postgres';
ALTER USER postgres WITH SUPERUSER;
```

**Option B: Using Docker (Recommended)**
```bash
docker run --name postgres-shago \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=shago_db \
  -p 5432:5432 \
  -d postgres:15
```

### Step 2: Install Dependencies

```bash
cd shago-backend
npm install
```

### Step 3: Run Database Migrations

```bash
npm run migration:run
```

This creates all tables:
- support_tickets
- feedback
- payments
- promotions
- And existing tables

### Step 4: Set Up Payment Gateways

**Paystack Setup:**
1. Go to https://dashboard.paystack.com
2. Sign up / Log in
3. Go to Settings > API Keys
4. Copy Secret Key and Public Key
5. Paste into `.env`:
   ```
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   ```

**Flutterwave Setup:**
1. Go to https://dashboard.flutterwave.com
2. Sign up / Log in
3. Go to Settings > API Keys
4. Copy Secret Key and Public Key
5. Paste into `.env`:
   ```
   FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_xxxxx
   FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_xxxxx
   ```

### Step 5: Set Up Cloudinary (Image Uploads)

1. Go to https://cloudinary.com
2. Sign up for free account
3. Dashboard > Settings > API Keys
4. Copy Cloud Name, API Key, API Secret
5. Paste into `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   ```

### Step 6: Start Development Server

```bash
npm run start:dev
```

Server will start at: `http://localhost:3000`

---

## ✅ TESTING ENDPOINTS

After server starts, test the new Phase 2 endpoints:

**Support Tickets:**
```bash
curl http://localhost:3000/api/v1/vendor/support/tickets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Payments:**
```bash
curl http://localhost:3000/api/v1/vendor/payments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Marketing Promotions:**
```bash
curl http://localhost:3000/api/v1/vendor/marketing/promotions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 DATABASE TABLES CREATED

By running migrations:

1. **support_tickets** - Customer support tickets
2. **feedback** - Customer feedback
3. **payments** - Payment records
4. **promotions** - Vendor promotions

Plus all existing tables from Phase 1.

---

## 🔍 VERIFY SETUP

```bash
# Check connection
psql -h localhost -U postgres -d shago_db

# List tables
\dt

# Exit
\q
```

---

## 🚨 TROUBLESHOOTING

**Database connection failed:**
- Check DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD in .env
- Verify PostgreSQL is running
- Try: `psql -h localhost -U postgres`

**Migration failed:**
- Check database permissions
- Ensure database exists
- Try: `dropdb shago_db && createdb shago_db`
- Then run migrations again

**Payment gateway errors:**
- Verify API keys in .env
- Check https://dashboard.paystack.com for test/live mode
- Ensure @nestjs/axios is installed: `npm install @nestjs/axios`

**Cloudinary errors:**
- Verify cloud name and API keys
- Check https://cloudinary.com/console for correct values

---

## 📚 NEXT STEPS

1. ✅ Run migrations
2. ✅ Start development server
3. ✅ Test endpoints with JWT token
4. ✅ Connect frontend (vendor dashboard)
5. ✅ Integration testing

---

**Status:** Ready for deployment! 🎉
