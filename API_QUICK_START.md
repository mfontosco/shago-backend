# Shago API - Quick Start Guide

**For:** Backend developers implementing new endpoints  
**Purpose:** Fast reference for common patterns  
**Version:** 1.0

---

## 🚀 Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env with your database credentials

# 3. Run migrations
npm run migration:run

# 4. Seed database with default roles
npm run seed

# 5. Start development server
npm run start:dev
```

Server will be available at: `http://localhost:3000/api/v1`

---

## 📝 Creating a New Endpoint

### Simple Public Endpoint (No Auth)

```typescript
// src/products/products.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  // GET /api/v1/products
  @Get()
  async listProducts() {
    return {
      statusCode: 200,
      message: 'Success',
      data: await this.service.findAll(),
    };
  }
}
```

### Protected Endpoint (With Role Check)

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('admin')
@UseGuards(RolesGuard)  // ← Enable role checking
export class AdminController {
  constructor(private readonly service: AdminService) {}

  // GET /api/v1/admin/users
  // Only accessible to ADMIN or SUPER_ADMIN roles
  @Get('users')
  @Roles('ADMIN', 'SUPER_ADMIN')  // ← Specify required roles
  async getAllUsers() {
    return {
      statusCode: 200,
      message: 'Success',
      data: await this.service.findAllUsers(),
    };
  }
}
```

---

## 🔐 Authentication & Authorization

### Get Current User

```typescript
import { Controller, Get, Request } from '@nestjs/common';

@Controller('users')
@UseGuards(AuthGuard)  // ← Must be authenticated
export class UsersController {
  @Get('me')
  getProfile(@Request() req) {
    // req.user = User object with role loaded
    const user = req.user;
    console.log(user.email);        // User's email
    console.log(user.role.name);    // User's role name
    console.log(user.role.permissions); // User's permissions array
    
    return { user };
  }
}
```

### Role Hierarchy

```
SUPER_ADMIN    ← Full access (reserved for system admins)
  ↓
ADMIN          ← Administrative operations
  ↓
USER           ← Standard user (default for registered users)
  ↓
VENDOR         ← Third-party sellers
  ↓
GUEST          ← Anonymous/limited access
```

### Checking Permissions in Service

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ProductService {
  canDeleteProduct(user: User, productId: string): boolean {
    // Check if user has permission
    const hasPermission = user.role.permissions.some(
      p => p.resource === 'products' && p.action === 'delete'
    );
    
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete products'
      );
    }
    
    return true;
  }
}
```

---

## ✅ Input Validation

### Create a DTO

```typescript
// src/products/dtos/create-product.dto.ts
import { IsString, IsNumber, IsUUID, MinLength, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(3, { message: 'Product name must be at least 3 characters' })
  name: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsNumber()
  @Min(0, { message: 'Price must be positive' })
  price: number;

  @IsUUID()
  category_id: string;
}
```

### Use in Controller

```typescript
@Controller('products')
export class ProductsController {
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createProduct(@Body() dto: CreateProductDto) {
    // dto is automatically validated and transformed
    // If invalid, ValidationPipe returns 400 with errors
    
    return {
      statusCode: 201,
      message: 'Product created',
      data: await this.service.create(dto),
    };
  }
}
```

### Validation Decorators Reference

```typescript
// String validations
@IsString()
@MinLength(3)
@MaxLength(255)
@Email()
@Matches(/regex/)
@IsIn(['option1', 'option2'])

// Number validations
@IsNumber()
@Min(0)
@Max(999999)
@IsPositive()

// Array validations
@IsArray()
@ArrayMinSize(1)
@ArrayMaxSize(10)
@IsUUID('all', { each: true })  // Array of UUIDs

// Date validations
@IsDate()
@Min(new Date('2020-01-01'))

// Optional fields
@IsOptional()
@MinLength(3)
name?: string;
```

---

## 🛡️ Error Handling

### Throwing Errors

```typescript
import { HttpException, HttpStatus, BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

// Specific exceptions (recommended)
throw new NotFoundException('Product not found');
throw new ForbiddenException('Access denied');
throw new BadRequestException('Invalid email format');
throw new ConflictException('Email already exists');

// Generic HTTP exception
throw new HttpException(
  {
    statusCode: 422,
    message: 'Custom error message',
    errors: [{ field: 'email', message: 'Invalid' }]
  },
  HttpStatus.UNPROCESSABLE_ENTITY
);
```

### Error Response (Automatic)

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "timestamp": "2026-08-10T12:34:56Z"
}
```

```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "errors": [
    { "field": "email", "message": "Must be unique" }
  ],
  "timestamp": "2026-08-10T12:34:56Z"
}
```

---

## 📊 Standard Response Format

### Success Response (2xx)

```typescript
// List (paginated)
{
  "statusCode": 200,
  "message": "Success",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}

// Single resource
{
  "statusCode": 200,
  "message": "Success",
  "data": { id: "...", name: "..." }
}

// Created
{
  "statusCode": 201,
  "message": "Resource created",
  "data": { id: "...", name: "..." }
}
```

### Error Response (4xx, 5xx)

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "timestamp": "2026-08-10T12:34:56Z"
}
```

---

## 🧪 Testing Endpoints

### Using cURL

```bash
# Get all products (public)
curl http://localhost:3000/api/v1/products

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get user profile (with token)
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Try to access admin endpoint (should fail)
curl http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Create new POST request
2. URL: `http://localhost:3000/api/v1/auth/login`
3. Body (JSON):
   ```json
   {
     "email": "user@example.com",
     "password": "password"
   }
   ```
4. Send → Copy `accessToken`
5. Go to Headers tab
6. Add: `Authorization: Bearer {paste_token}`
7. Use in other requests

---

## 📚 Common Patterns

### Pagination

```typescript
import { Query } from '@nestjs/common';

@Get()
async list(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
) {
  const [data, total] = await this.service.findWithPagination(page, limit);
  return {
    statusCode: 200,
    message: 'Success',
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}
```

### Filtering

```typescript
@Get()
async list(
  @Query('status') status?: string,
  @Query('category_id') categoryId?: string,
) {
  const filters = { status, category_id: categoryId };
  const data = await this.service.find(filters);
  return { statusCode: 200, message: 'Success', data };
}
```

### File Upload

```typescript
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';

@Post('avatar')
@UseInterceptors(FileInterceptor('file'))
async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  const url = await this.service.uploadToStorage(file);
  return { statusCode: 201, message: 'Success', data: { url } };
}
```

---

## 🔍 Debugging

### View Request Details

```typescript
@Get()
getInfo(@Request() req) {
  console.log('User:', req.user);
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  console.log('Params:', req.params);
  console.log('Body:', req.body);
  
  return { statusCode: 200 };
}
```

### Enable Debug Logging

```bash
# Development
npm run start:dev

# Watch logs in terminal (will show detailed request/response info)
```

### Database Inspection

```sql
-- Check what roles exist
SELECT * FROM roles;

-- Check what permissions exist
SELECT * FROM permissions;

-- See a user's role
SELECT u.email, r.name FROM users u
LEFT JOIN roles r ON u.role_id = r.id;

-- See role permissions
SELECT r.name, p.resource, p.action FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id;
```

---

## 📖 API Endpoints (Phase 1)

### Auth (Public)
```
POST   /api/v1/auth/login              Login and get JWT
POST   /api/v1/auth/register           Create new user account
POST   /api/v1/auth/refresh-token      Get new access token
```

### Users (Protected)
```
GET    /api/v1/users/me                Get your profile
PATCH  /api/v1/users/me                Update your profile
POST   /api/v1/users/change-password   Change your password
```

### Admin (Protected - ADMIN+ only)
```
GET    /api/v1/admin/users             List all users
GET    /api/v1/admin/users/:id         Get user details
PATCH  /api/v1/admin/users/:id         Update user
DELETE /api/v1/admin/users/:id         Delete user
```

---

## ⚡ Performance Tips

1. **Use pagination** - Always limit returned data
2. **Select specific fields** - Use `.select()` in queries
3. **Avoid N+1** - Use eager loading `.leftJoinAndSelect()`
4. **Cache frequently accessed data** - Roles, permissions
5. **Index database columns** - email, role_id, created_at

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Missing JWT token in Authorization header |
| 403 Forbidden | User doesn't have required role |
| 400 Bad Request | Invalid DTO or validation failed |
| 404 Not Found | Resource doesn't exist |
| 409 Conflict | Duplicate resource (email already registered) |
| 500 Error | Check server logs |

---

## 📞 Need Help?

1. Check `SYSTEM_DESIGN.md` for architecture details
2. Check `PHASE_1_IMPLEMENTATION.md` for implementation details
3. Read test files: `src/*/**.spec.ts`
4. Check NestJS docs: https://docs.nestjs.com

---

**Last Updated:** August 10, 2026  
**Version:** 1.0
