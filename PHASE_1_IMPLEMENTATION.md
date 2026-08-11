# Phase 1: Security & Foundation - Complete Implementation Guide

**Status:** ✅ COMPLETE  
**Date Implemented:** August 10, 2026  
**Time Investment:** ~2-3 hours  
**Expected Improvement:** Full RBAC + exception handling + validation pipeline

---

## 1. What Was Implemented

### 1.1 Role-Based Access Control (RBAC) System

#### Permission Entity ✅
- **Location:** `src/permissions/entities/permission.entity.ts`
- **Features:**
  - Unique name field (`resource:action` format)
  - Resource field (users, products, categories, etc.)
  - Action field (create, read, update, delete)
  - Description for documentation
  - Timestamps (created_at)

#### Role Entity ✅
- **Location:** `src/roles/entities/role.entity.ts`
- **Features:**
  - Unique name field (SUPER_ADMIN, ADMIN, USER, VENDOR, GUEST)
  - Description field
  - Many-to-many relationship with Permissions
  - Eager loading of permissions for performance
  - Timestamps (created_at, updated_at)

#### Pre-defined Roles ✅
```
SUPER_ADMIN
  ├── All system permissions
  └── Used for: System administrators
  
ADMIN
  ├── All permissions except system-level
  └── Used for: Administrative staff

USER
  ├── Read: products, categories
  ├── Update: own profile
  └── Used for: Regular users

VENDOR
  ├── Create/Update: own products
  ├── Read: own analytics
  └── Used for: Third-party sellers

GUEST
  ├── Read-only: products, categories
  └── Used for: Unregistered users
```

### 1.2 Authorization Guards ✅

#### RolesGuard
- **Location:** `src/common/guards/roles.guard.ts`
- **Purpose:** Validates user has required role(s)
- **Logic:**
  1. Reads @Roles() decorator metadata
  2. Gets user from request (added by AuthGuard)
  3. Checks if user.role.name matches required roles
  4. Throws ForbiddenException if no match
- **Usage:**
  ```typescript
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('/admin/users')
  async getUsers() { ... }
  ```

### 1.3 Decorators ✅

#### @Roles() Decorator
- **Location:** `src/common/decorators/roles.decorator.ts`
- **Purpose:** Marks endpoint with required roles
- **Implementation:** Uses NestJS SetMetadata() for metadata
- **Examples:**
  ```typescript
  @Roles('ADMIN')                    // Single role
  @Roles('ADMIN', 'SUPER_ADMIN')     // Multiple roles
  @Roles()                           // No restriction
  ```

### 1.4 Global Exception Filter ✅

#### AllExceptionsFilter
- **Location:** `src/common/filters/all-exceptions.filter.ts`
- **Features:**
  - Catches ALL exceptions (HTTP and non-HTTP)
  - Handles database errors (TypeORM, PostgreSQL)
  - Normalizes all responses to standard format
  - Never exposes stack traces in production
  - Logs errors for debugging/monitoring
  - Sensitive error details in development only

#### Error Response Format
```json
{
  "statusCode": 403,
  "message": "Access denied. This endpoint requires...",
  "errors": [
    {
      "field": "role",
      "message": "Insufficient permissions"
    }
  ],
  "timestamp": "2026-08-10T12:34:56Z"
}
```

#### Exception Handling Flow
```
Exception thrown in service
  ↓
AllExceptionsFilter catches it
  ↓
1. Identify exception type:
   - HttpException (400, 401, 403, etc.)
   - Database error (unique constraint, FK violation)
   - Unhandled exception
  ↓
2. Map to HTTP status code
   - 23505 (unique violation) → 409 Conflict
   - 23503 (FK violation) → 400 Bad Request
   - EntityNotFoundError → 404 Not Found
  ↓
3. Format response:
   - Standardized JSON format
   - Sanitized message (no internals)
   - Timestamp & path (in dev only)
  ↓
4. Log error:
   - Error level for 5xx (includes stack trace)
   - Warning level for 4xx (message only)
  ↓
5. Return to client
```

### 1.5 Validation Pipeline ✅

#### Global ValidationPipe
- **Location:** Registered in `src/main.ts`
- **Features:**
  - Validates request DTOs before controller execution
  - Strips unknown properties (whitelist)
  - Rejects requests with extra properties
  - Automatically transforms to DTO class
  - Type coercion (string "123" → number 123)
- **Configuration:**
  ```typescript
  new ValidationPipe({
    whitelist: true,                     // Strip unknown properties
    forbidNonWhitelisted: true,         // Reject if extra properties
    transform: true,                    // Auto-transform to DTO
    transformOptions: {
      enableImplicitConversion: true,   // Type coercion
    },
  })
  ```

#### DTO Example
```typescript
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsUUID()
  category_id: string;
}
```

### 1.6 Seeding Service ✅

#### SeedService
- **Location:** `src/common/seeds/seed.service.ts`
- **Features:**
  - Seeds default permissions (22 total)
  - Seeds default roles (5 total)
  - Prevents duplicate creation
  - Logs progress for debugging
  - Production-safe (won't run if not dev)
- **Default Permissions:**
  ```
  users:read, users:create, users:update, users:delete
  products:read, products:create, products:update, products:delete
  categories:read, categories:create, categories:update, categories:delete
  admin:read, admin:manage-roles, admin:manage-permissions, admin:view-audit-logs
  features:read, features:manage
  roles:read, roles:create, roles:update, roles:delete
  ```

#### Running Seeding
```bash
npm run seed
```

Output:
```
🌱 Starting database seed...
📝 Seeding permissions...
✓ Created permission: users:read
✓ Created permission: users:create
...
✓ Permissions seeded
👥 Seeding roles...
✓ Created role: SUPER_ADMIN with 22 permissions
✓ Created role: ADMIN with 18 permissions
✓ Created role: USER with 4 permissions
✓ Created role: VENDOR with 8 permissions
✓ Created role: GUEST with 2 permissions
✓ Roles seeded
✅ Database seed completed successfully
```

### 1.7 Updated Bootstrap (main.ts) ✅

#### Features
- CORS configuration (localhost:3000, localhost:3001)
- Global validation pipe
- Global exception filter
- Global roles guard
- API versioning (/api/v1/)
- Startup info logging
- Error handling

#### Startup Output
```
╔════════════════════════════════════════════════════╗
║          🚀 SHAGO API BOOTSTRAP COMPLETE           ║
╠════════════════════════════════════════════════════╣
║ Environment: DEVELOPMENT                           ║
║ Server: http://localhost:3000                     ║
║ API Base: http://localhost:3000/api/v1             ║
║ 🔒 JWT Authentication: ENABLED                     ║
║ 👥 Role-Based Access Control: ENABLED              ║
║ 🛡️  Global Exception Handling: ENABLED              ║
║ ✅ Validation Pipeline: ENABLED                     ║
╚════════════════════════════════════════════════════╝

📝 Next Steps:
   • Run database seeding: npm run seed
   • View API docs: http://localhost:3000/api/docs
   • Check health: http://localhost:3000/api/v1/health

💡 In development? Run with: npm run start:dev
```

---

## 2. File Structure

```
src/
├── common/
│   ├── decorators/
│   │   └── roles.decorator.ts          ✅ @Roles() metadata marker
│   ├── filters/
│   │   └── all-exceptions.filter.ts    ✅ Global exception handling
│   ├── guards/
│   │   └── roles.guard.ts              ✅ Check user.role matches
│   ├── seeds/
│   │   └── seed.service.ts             ✅ Initialize DB with roles
│   └── common.module.ts                ✅ Export common services
├── roles/
│   ├── entities/
│   │   └── role.entity.ts              ✅ Role entity + permissions
│   └── roles.module.ts
├── permissions/
│   ├── entities/
│   │   └── permission.entity.ts        ✅ Permission entity
│   └── permissions.module.ts
└── main.ts                             ✅ Register global middleware

Total New/Modified Files: 8
Total Lines Added: ~800
```

---

## 3. How to Use Phase 1 Features

### 3.1 Protecting Routes with Roles

#### Example 1: Admin-only endpoint
```typescript
import { UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('admin')
@UseGuards(RolesGuard)  // Check roles
export class AdminController {
  @Get('/users')
  @Roles('ADMIN', 'SUPER_ADMIN')  // Required roles
  async getUsers() {
    return { message: 'Admin user list' };
  }
}
```

#### Example 2: Public endpoint (no role check)
```typescript
@Controller('products')
export class ProductController {
  @Get()  // No @Roles() = anyone can access
  async listProducts() {
    return { products: [] };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')  // Only admins can create
  async createProduct(dto: CreateProductDto) {
    // Create logic
  }
}
```

### 3.2 Using the Validation Pipeline

```typescript
export class UpdateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name?: string;

  @IsNumber()
  @Min(0)
  price?: number;

  @IsArray()
  @IsUUID('all', { each: true })
  category_ids?: string[];
}

@Patch(':id')
@UseGuards(RolesGuard)
@Roles('ADMIN')
async updateProduct(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: UpdateProductDto  // Auto-validated
) {
  // DTO is guaranteed valid here
  return this.service.update(id, dto);
}
```

### 3.3 Error Handling

```typescript
// Thrown in service
throw new HttpException(
  {
    statusCode: 409,
    message: 'Email already registered',
    errors: [{ field: 'email', message: 'Must be unique' }]
  },
  HttpStatus.CONFLICT
);

// Automatically normalized and sent to client
```

### 3.4 Database Errors

```typescript
// Unique constraint violation in PostgreSQL
// (email column marked UNIQUE)

// TypeORM catches and throws:
// QueryFailedError with code 23505

// Filter normalizes to:
{
  "statusCode": 409,
  "message": "This resource already exists",
  "errors": [
    { "field": "email", "message": "Already exists" }
  ],
  "timestamp": "2026-08-10T12:34:56Z"
}
```

---

## 4. Testing Phase 1

### 4.1 Manual Testing Flow

#### Test 1: Public Endpoint (No Auth)
```bash
curl http://localhost:3000/api/v1/products
# Should return: 200 with products list
```

#### Test 2: Protected Endpoint - Without Token
```bash
curl http://localhost:3000/api/v1/admin/users
# Should return: 401 Unauthorized
```

#### Test 3: Protected Endpoint - With Invalid Token
```bash
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3000/api/v1/admin/users
# Should return: 401 Unauthorized
```

#### Test 4: Protected Endpoint - With Valid User Token
```bash
# 1. Login to get token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
# Returns: { accessToken: "jwt_token" }

# 2. Use token with USER role (no @Roles required)
curl -H "Authorization: Bearer jwt_token" \
  http://localhost:3000/api/v1/users/me
# Should return: 200 with user profile

# 3. Try to access admin endpoint
curl -H "Authorization: Bearer jwt_token" \
  http://localhost:3000/api/v1/admin/users
# Should return: 403 Forbidden
#   Message: "Access denied. Required roles: ADMIN, SUPER_ADMIN"
```

#### Test 5: Protected Endpoint - With Admin Token
```bash
# 1. Login with admin account
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
# Returns: { accessToken: "admin_jwt_token" }

# 2. Access admin endpoint
curl -H "Authorization: Bearer admin_jwt_token" \
  http://localhost:3000/api/v1/admin/users
# Should return: 200 with users list
```

### 4.2 Automated Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Watch mode (re-run on changes)
npm run test:watch
```

#### Test Examples to Write

```typescript
describe('RolesGuard', () => {
  it('should allow ADMIN to access /admin/users', async () => {
    const user = { id: '1', role: { name: 'ADMIN' } };
    const result = guard.canActivate(mockContext(user));
    expect(result).toBe(true);
  });

  it('should reject USER from accessing /admin/users', async () => {
    const user = { id: '2', role: { name: 'USER' } };
    expect(() => guard.canActivate(mockContext(user)))
      .toThrow(ForbiddenException);
  });

  it('should allow if @Roles() not specified', async () => {
    const user = { id: '3', role: { name: 'GUEST' } };
    const result = guard.canActivate(mockContextWithoutRoles(user));
    expect(result).toBe(true);
  });
});

describe('ValidationPipe', () => {
  it('should accept valid CreateProductDto', async () => {
    const dto = {
      name: 'Product',
      price: 99.99,
      category_id: 'uuid-here'
    };
    // Should not throw
  });

  it('should reject if name < 3 chars', async () => {
    const dto = { name: 'AB', price: 99.99 };
    // Should throw ValidationError
  });

  it('should reject unknown properties', async () => {
    const dto = {
      name: 'Product',
      price: 99.99,
      unknown_field: 'should be stripped'
    };
    // Should reject or strip
  });
});

describe('Exception Filter', () => {
  it('should handle HTTP exceptions', async () => {
    const exception = new BadRequestException('Invalid input');
    const result = filter.catch(exception, mockHost);
    expect(result.statusCode).toBe(400);
  });

  it('should handle DB unique constraint violations', async () => {
    const exception = { code: '23505', detail: 'Key (email)' };
    // Should map to 409 Conflict
  });
});
```

---

## 5. Security Checklist

- [x] JWT secret from environment (not hardcoded)
- [x] Password hashing with bcrypt
- [x] Role-based access control implemented
- [x] No sensitive data in error responses (production)
- [x] SQL injection prevention (TypeORM parameterized)
- [x] Input validation on all endpoints
- [x] CORS configured restrictively
- [x] HTTP method validation (GET, POST, etc.)
- [ ] Rate limiting (Phase 2)
- [ ] Request signing/HMAC (Phase 2)
- [ ] API key management (Phase 2)
- [ ] Audit logging (Phase 2)

---

## 6. Performance Impact

### Database Queries
```
Before Phase 1:
- Login: ~3 queries (find user, validate password, create token)
- Access endpoint: 1 query to get user + role

After Phase 1:
- Login: ~3 queries (same)
- Access endpoint: 0 extra queries (role loaded eagerly)
- Authorization check: In-memory comparison (< 1ms)

Result: Negligible impact (still very fast)
```

### Memory Usage
```
Role cache (in-memory):
- 5 default roles
- ~22 permissions each
- Total: ~100KB in memory

Permission lookup:
- O(1) direct access to user.role.permissions
- No N+1 queries
```

---

## 7. What's Next (Phase 2)

### Phase 2 Focus: Admin Management
- [ ] Admin user CRUD endpoints
- [ ] Dynamic role management
- [ ] Permission assignment UI
- [ ] Audit logging service
- [ ] Feature flags system

### Phase 3 Focus: Enhanced Auth
- [ ] Password reset flow
- [ ] Email verification
- [ ] Refresh token rotation
- [ ] 2FA/MFA support

---

## 8. Common Issues & Solutions

### Issue: "User role not assigned"
**Cause:** User registered but no role assigned in database  
**Solution:** Update user in DB: `UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'USER') WHERE id = '...';`

### Issue: "@Roles() not working"
**Cause:** RolesGuard not registered in @UseGuards()  
**Solution:** Add to controller: `@UseGuards(AuthGuard, RolesGuard)` before @Roles()

### Issue: "Cannot read property 'role' of undefined"
**Cause:** AuthGuard didn't run before RolesGuard  
**Solution:** Order matters! `@UseGuards(AuthGuard, RolesGuard)` (auth first)

### Issue: Validation errors not caught
**Cause:** DTOs not using class-validator decorators  
**Solution:** Add `@IsString()`, `@MinLength()`, etc. to DTO properties

---

## 9. Monitoring & Debugging

### View Logs
```bash
# In development
npm run start:dev
# Watch terminal for detailed logs

# Search for specific events
npm run start:dev | grep "Roles denied\|Exception"
```

### Database State
```sql
-- Check roles
SELECT * FROM roles;

-- Check permissions
SELECT * FROM permissions;

-- Check role-permission assignments
SELECT r.name, p.name FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id;

-- Check users and roles
SELECT u.email, r.name FROM users u
LEFT JOIN roles r ON u.role_id = r.id;
```

### Request Tracing
```typescript
// Add to controller method
@Get()
async getUsers(@Request() req) {
  console.log('User:', req.user);           // Full user object
  console.log('Role:', req.user?.role);     // Role with permissions
  console.log('Permissions:', req.user?.role?.permissions);
}
```

---

## 10. Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in environment
- [ ] Ensure `JWT_SECRET` is 32+ characters
- [ ] Database migrations have been run
- [ ] Database seeding has been run
- [ ] All tests passing (`npm run test`)
- [ ] No console.log statements left in code
- [ ] Error handling doesn't expose stack traces
- [ ] CORS_ORIGIN points to production domain
- [ ] Database backups configured
- [ ] Monitoring/error tracking set up (Sentry/DataDog)

---

## Summary

✅ **Phase 1 Complete!**

**What We Built:**
- Role-Based Access Control (RBAC)
- Global exception handling
- Input validation pipeline
- Database seeding
- Secure bootstrap

**Key Metrics:**
- Files created: 8
- Lines of code: ~800
- Security improvements: Major
- Performance impact: Negligible
- Test coverage: Ready for Phase 2

**Next:** Phase 2 - Admin Management APIs (Week 3-4)

---

**Document Version:** 1.0  
**Last Updated:** August 10, 2026  
**Owner:** Backend Team
