# Shago API - System Design & Architecture

**Version:** 1.0  
**Date:** August 10, 2026  
**Status:** Enterprise-Grade Design Document

---

## 1. System Overview

### Vision
Build a scalable, secure, and maintainable REST API that powers:
- **Admin Dashboard** (Next.js frontend - operational management)
- **Mobile User App** (ride-sharing/delivery service)
- **Mobile Rider App** (driver management)

### Tech Stack
- **Runtime:** Node.js
- **Framework:** NestJS 11 (TypeScript)
- **Database:** PostgreSQL 13+
- **Authentication:** JWT (access + refresh tokens)
- **ORM:** TypeORM 0.3 (migrations-first)
- **Validation:** class-validator + Zod
- **Testing:** Jest + Supertest
- **Deployment:** Docker + Kubernetes-ready

---

## 2. Architectural Principles

### 2.1 SOLID Principles
- **S**ingle Responsibility: Each service handles one domain
- **O**pen/Closed: Extend via modules, don't modify existing code
- **L**iskov Substitution: Guards/filters are interchangeable
- **I**nterface Segregation: Specific DTOs per use case
- **D**ependency Inversion: Inject abstractions, not concrete implementations

### 2.2 Enterprise Patterns
- **Layered Architecture:** Controllers → Services → Repositories → Database
- **RBAC (Role-Based Access Control):** Granular permissions per operation
- **Event Sourcing Ready:** Audit logs capture state changes
- **Circuit Breaker:** Handle external service failures
- **Rate Limiting:** Prevent API abuse

### 2.3 Security Principles
- **Defense in Depth:** Multiple security layers (auth → authorization → validation → sanitization)
- **Principle of Least Privilege:** Users have minimum required permissions
- **Fail Secure:** Deny by default, grant explicitly
- **Secrets Management:** All sensitive data in environment variables
- **Audit Trail:** All sensitive operations logged

---

## 3. API Architecture

### 3.1 URL Structure
```
/api/v1/
├── /auth                          # Public, no auth required
│   ├── POST   /login              # Email + password
│   ├── POST   /register           # Create new user
│   ├── POST   /refresh-token      # Get new access token
│   ├── POST   /forgot-password    # Initiate password reset
│   └── POST   /reset-password     # Complete password reset
│
├── /admin                         # Protected, @Roles('ADMIN', 'SUPER_ADMIN')
│   ├── /users                     # Admin user management
│   │   ├── GET    /               # List all users (paginated)
│   │   ├── GET    /:id            # Get user details
│   │   ├── PATCH  /:id            # Update user info
│   │   ├── DELETE /:id            # Soft delete user
│   │   └── POST   /:id/roles      # Assign roles
│   ├── /roles                     # Role management
│   │   ├── GET    /               # List all roles
│   │   ├── POST   /               # Create role
│   │   ├── PATCH  /:id            # Update role
│   │   ├── DELETE /:id            # Delete role
│   │   └── PATCH  /:id/permissions # Manage permissions
│   └── /audit-logs                # Audit trail
│       ├── GET    /               # Query logs (filtered)
│       └── GET    /export         # Export as CSV
│
├── /users                         # Protected, @Roles('USER', 'ADMIN')
│   ├── GET    /me                 # Get current user profile
│   ├── PATCH  /me                 # Update profile
│   ├── POST   /avatar             # Upload avatar
│   ├── POST   /change-password    # Change password
│   └── GET    /preferences        # User preferences
│
├── /products                      # Public read, protected write
│   ├── GET    /                   # List products (paginated, filterable)
│   ├── GET    /:id                # Get product details
│   ├── POST   /                   # Create product (@Roles('ADMIN'))
│   ├── PATCH  /:id                # Update product (@Roles('ADMIN'))
│   ├── DELETE /:id                # Soft delete product (@Roles('ADMIN'))
│   ├── GET    /search             # Full-text search
│   └── POST   /import             # Bulk import (@Roles('ADMIN'))
│
├── /categories                    # Public read, protected write
│   ├── GET    /                   # List categories
│   ├── GET    /:id                # Get category with products
│   ├── POST   /                   # Create category (@Roles('ADMIN'))
│   ├── PATCH  /:id                # Update category (@Roles('ADMIN'))
│   └── DELETE /:id                # Delete category (@Roles('ADMIN'))
│
├── /features                      # Protected, @Roles('ADMIN')
│   ├── GET    /                   # List feature flags
│   ├── POST   /                   # Create feature
│   ├── PATCH  /:id                # Update feature
│   └── DELETE /:id                # Delete feature
│
└── /health                        # Public, healthcheck
    └── GET    /                   # Returns status + version
```

### 3.2 Request/Response Format

#### Success Response (2xx)
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    ...
  },
  "timestamp": "2026-08-10T12:34:56Z"
}
```

#### Paginated Response
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  },
  "timestamp": "2026-08-10T12:34:56Z"
}
```

#### Error Response (4xx, 5xx)
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2026-08-10T12:34:56Z"
}
```

---

## 4. Authentication & Authorization

### 4.1 JWT Strategy
```
Access Token (short-lived, 1 hour)
├── subject: user_id
├── role: ['ADMIN', 'USER']
└── permissions: ['read:products', 'write:profile']

Refresh Token (long-lived, 7 days)
└── Used to obtain new access token without re-login
```

### 4.2 RBAC Model
```
User
  ├── Role (SUPER_ADMIN | ADMIN | USER | GUEST | VENDOR)
  └── Role has many Permissions

Permission (resource:action)
├── Subjects: users, products, categories, orders, etc.
├── Actions: create, read, update, delete
└── Example: "products:write", "users:read", "orders:delete"

Access Control Flow:
User makes request
  ↓
AuthGuard (validates JWT)
  ↓
RolesGuard (checks user.role)
  ↓
PermissionsGuard (checks specific permissions)
  ↓
Controller endpoint
```

### 4.3 Password Security
- **Hashing:** bcrypt with 10+ rounds
- **Reset Flow:** 
  1. User requests password reset
  2. Email sent with unique token (expires in 1 hour)
  3. User clicks link, sets new password
  4. Old refresh tokens are invalidated

---

## 5. Database Design

### 5.1 Entity Relationships
```
Users (1) ←→ (M) Roles
Users (1) ←→ (M) AuditLogs
Users (1) ←→ (M) PasswordResets
Roles (M) ←→ (M) Permissions
Products (M) ←→ (1) Category
Products (1) ←→ (M) ProductVariants
Products (1) ←→ (M) ProductImages
ProductVariants (M) ←→ (M) Attributes
```

### 5.2 Key Entities

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT false,
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL  -- Soft delete
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
```

#### Roles Table
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,  -- SUPER_ADMIN, ADMIN, USER
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Permissions Table
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  resource VARCHAR(50) NOT NULL,  -- users, products, orders
  action VARCHAR(20) NOT NULL,    -- create, read, update, delete
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_resource_action ON permissions(resource, action);
```

#### AuditLogs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,
  entity_id UUID,
  changes JSONB,  -- {"field": "status", "old": "active", "new": "inactive"}
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 6. Error Handling Strategy

### 6.1 HTTP Status Codes
```
200 OK              - Request succeeded
201 Created         - Resource created
204 No Content      - Success, no response body
400 Bad Request     - Validation error
401 Unauthorized    - Missing/invalid auth
403 Forbidden       - Insufficient permissions
404 Not Found       - Resource doesn't exist
409 Conflict        - Duplicate resource (email exists)
429 Too Many Requests - Rate limit exceeded
500 Internal Server Error - Unhandled exception
503 Service Unavailable - Database/external service down
```

### 6.2 Exception Handling Flow
```
Throw exception in service
  ↓
GlobalExceptionFilter catches it
  ↓
Normalize to standard error response
  ↓
Log to error tracking (Sentry, DataDog)
  ↓
Return standardized JSON (never expose stack traces)
```

---

## 7. Validation Strategy

### 7.1 Multi-Layer Validation
```
HTTP Request
  ↓
Pipe (validate DTO)
  ├── Class-validator decorators
  └── Custom validators
  ↓
Guard (check authorization)
  ├── AuthGuard (JWT valid?)
  ├── RolesGuard (has role?)
  └── PermissionsGuard (has permission?)
  ↓
Service (business logic validation)
  ├── Check business constraints
  ├── Validate state transitions
  └── Check resource ownership
  ↓
Database (enforce constraints)
  ├── Unique constraints
  ├── Foreign keys
  └── Check constraints
```

### 7.2 DTO Example
```typescript
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsUUID()
  category_id: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}
```

---

## 8. Performance Optimization

### 8.1 Query Optimization
- **Pagination:** Always limit results (default: 20, max: 100)
- **Selective Retrieval:** Use DTOs to exclude sensitive fields
- **Database Indexes:** On frequently queried columns (email, role_id, created_at)
- **Eager Loading:** Use `@ManyToMany({ eager: true })` judiciously
- **Query Caching:** Redis for role/permission lookups (60-second TTL)

### 8.2 Caching Strategy
```
GET /api/v1/roles
  → Check Redis cache (key: 'roles:all')
  → If miss: query DB, cache for 60s
  → If hit: return from cache

Invalidation:
  POST /api/v1/admin/roles
    → Create new role in DB
    → Delete cache key 'roles:all'
    → Next GET will refresh cache
```

### 8.3 Rate Limiting
```
By IP address:
├── 100 requests per 15 minutes (public endpoints)
└── 1000 requests per 15 minutes (authenticated endpoints)

By user ID:
├── 500 requests per hour (admin operations)
└── 50 requests per hour (password reset)
```

---

## 9. Testing Strategy

### 9.1 Test Pyramid
```
          /\
         /  \  E2E Tests (10%)
        /____\  ├── Critical user flows
       /      \ ├── Login → Create product → Verify in DB
      /  Unit  \ └── Admin audit logging
     /   Tests  \
    /    (70%)   \
   /_______________\
   Integration (20%)
   ├── Controller + Service
   ├── Database interactions
   └── Guard authorization
```

### 9.2 Test Scenarios
```
Auth Tests:
  ✓ Register with valid email
  ✓ Reject duplicate email
  ✓ Reject weak password
  ✓ Login returns JWT tokens
  ✓ Refresh token works
  ✓ Expired token rejected
  ✓ Invalid signature rejected

Authorization Tests:
  ✓ Unauthenticated request rejected
  ✓ USER cannot access /admin routes
  ✓ ADMIN can access /admin routes
  ✓ User can only access own profile
  ✓ Rate limit enforced

Business Logic Tests:
  ✓ Product created with all variants
  ✓ Inventory decreases on order
  ✓ Soft delete doesn't return product
  ✓ Audit log created on admin action
```

---

## 10. Monitoring & Logging

### 10.1 Logging Strategy
```typescript
// Structured logging for machine readability
logger.info('User login', {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  ipAddress: '192.168.1.1',
  timestamp: '2026-08-10T12:34:56Z'
});

// Log levels:
logger.debug()  // Development debugging
logger.info()   // Normal operations
logger.warn()   // Unexpected but recoverable
logger.error()  // Errors that need attention
```

### 10.2 Metrics to Track
```
Performance:
├── Request latency (p50, p95, p99)
├── Database query time
└── API response size

Errors:
├── 4xx error rate (by endpoint)
├── 5xx error rate (by service)
└── Most common errors

Business:
├── Users registered per day
├── Login success rate
├── Admin actions per day
└── Feature flag usage
```

### 10.3 Health Monitoring
```
GET /api/v1/health
{
  "status": "healthy",
  "timestamp": "2026-08-10T12:34:56Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "external_api": "connected"
  },
  "version": "1.0.0"
}
```

---

## 11. Deployment Architecture

### 11.1 Docker Strategy
```dockerfile
# Development stage
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start:dev"]

# Build stage
FROM development AS build
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### 11.2 Kubernetes Ready
```yaml
# Service
apiVersion: v1
kind: Service
metadata:
  name: shago-api
spec:
  selector:
    app: shago-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer

# Deployment with auto-scaling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shago-api
spec:
  replicas: 3  # Horizontal scaling
  selector:
    matchLabels:
      app: shago-api
  template:
    metadata:
      labels:
        app: shago-api
    spec:
      containers:
      - name: shago-api
        image: shago-api:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: shago-config
              key: db-host
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: shago-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## 12. Security Checklist

- [ ] All secrets in environment variables (never hardcoded)
- [ ] JWT signing key min 32 characters
- [ ] Password hashing with bcrypt 10+ rounds
- [ ] HTTPS enforced in production
- [ ] CORS configured restrictively
- [ ] Rate limiting on all endpoints
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries via TypeORM)
- [ ] XSS prevention (sanitize user inputs)
- [ ] CSRF tokens for state-changing operations
- [ ] Audit logging for sensitive operations
- [ ] Database backups automated
- [ ] Error responses don't expose sensitive info
- [ ] API versioning (/api/v1/) for backward compatibility

---

## 13. Development Workflow

### 13.1 Feature Implementation Steps
1. Create feature branch: `git checkout -b feat/user-authentication`
2. Write tests first (TDD): `src/auth/auth.service.spec.ts`
3. Implement feature: `src/auth/auth.service.ts`
4. Create migration if DB changes: `npm run migration:generate -- CreateUsersTable`
5. Update API docs (Swagger)
6. Run tests: `npm run test`
7. Create PR with test results
8. Merge after review + CI passes

### 13.2 Code Style
```typescript
// Service example following SOLID
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private passwordHasher: PasswordHasher,
    private auditLogger: AuditLogger,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    // Validate
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    // Hash password
    const passwordHash = await this.passwordHasher.hash(dto.password);

    // Create user
    const user = this.userRepo.create({
      ...dto,
      password_hash: passwordHash,
    });
    const saved = await this.userRepo.save(user);

    // Audit log
    await this.auditLogger.log({
      userId: 'system',
      resource: 'users',
      action: 'create',
      entityId: saved.id,
    });

    return saved;
  }
}
```

---

## 14. Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| API Uptime | 99.9% | |
| Request Latency (p95) | <200ms | |
| Error Rate | <0.1% | |
| Authentication Latency | <50ms | |
| Database Query Time | <100ms | |
| Test Coverage | >80% | |
| Security Vulnerabilities | 0 | |
| Documentation | 100% | |

---

## 15. Next Steps

**Week 1-2 (Phase 1):**
- Complete RBAC system
- Implement RolesGuard
- Create global exception filter
- Seed default roles

**Week 3-4 (Phase 2):**
- Build Admin CRUD endpoints
- Implement audit logging
- Feature flag infrastructure

**Week 5+:**
- Continue per roadmap

---

**Document Version:** 1.0  
**Last Updated:** August 10, 2026  
**Owner:** Backend Team
