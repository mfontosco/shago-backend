# Cloudinary Integration Setup Guide

**Status:** Ready to implement  
**Time Required:** 30 minutes  
**Complexity:** Easy

---

## 📋 What This Provides

With Cloudinary integration, you get:
- ✅ Cloud-based image hosting (no local storage)
- ✅ Automatic image optimization
- ✅ CDN delivery (fast globally)
- ✅ Image transformations (resize, crop, compress)
- ✅ Unlimited storage
- ✅ 2GB free tier (perfect for starting)

---

## 🚀 Step 1: Create Cloudinary Account

1. **Go to:** https://cloudinary.com/users/register/free
2. **Sign up** (free account)
3. **Get your credentials:**
   - Cloud Name
   - API Key
   - API Secret

---

## 📦 Step 2: Install Dependencies

```bash
npm install cloudinary next-cloudinary
npm install --save-dev @types/node
```

---

## 🔧 Step 3: Update Environment Variables

**File:** `.env`

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Example:
```bash
CLOUDINARY_CLOUD_NAME=dh7tx8y4n
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc-xyz-123
```

---

## 📝 Step 4: Add CloudinaryService

**File:** `src/common/services/cloudinary.service.ts`

✅ **Already created** - see the file I just provided

Key methods:
```typescript
uploadImage(file, folder, publicId)     // Upload single image
uploadImages(files, folder)              // Upload multiple images
deleteImage(publicId)                    // Delete from Cloudinary
getOptimizedUrl(publicId, width, height) // Get optimized URL
getThumbnailUrl(publicId)                // Get thumbnail
validateFile(file)                       // Validate before upload
```

---

## 🎮 Step 5: Update Products Controller

**File:** `src/products/controllers/products.controller.ts`

Replace with: `src/products/controllers/products.controller.upload.ts`

Key changes:
```typescript
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Post()
@UseInterceptors(FileInterceptor('image'))  // ← Handle file upload
async create(
  @Body() createProductDto: CreateProductDto,
  @UploadedFile() file: Express.Multer.File,  // ← File parameter
  @Request() req: ExpressRequest,
) {
  // Upload to Cloudinary
  if (file) {
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'products'
    );
    imageUrl = uploadResult.secure_url;  // ← Use secure URL
  }
  
  // Create product with image URL
  const product = await this.productsService.create({
    ...createProductDto,
    image_url: imageUrl,
  });
}
```

---

## 🛠️ Step 6: Update Products Module

**File:** `src/products/products.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryService } from '../../common/services/cloudinary.service';  // ← Add
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller.upload';  // ← Update path

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService, CloudinaryService],  // ← Add CloudinaryService
  exports: [ProductsService],
})
export class ProductsModule {}
```

---

## 📊 Step 7: Update Categories Similarly

Apply same pattern to Categories module:

**File:** `src/categories/controllers/categories.controller.ts`

```typescript
@Patch(':id')
@UseInterceptors(FileInterceptor('image'))
async update(
  @Param('id') id: string,
  @Body() updateCategoryDto: UpdateCategoryDto,
  @UploadedFile() file: Express.Multer.File,
  @Request() req: ExpressRequest,
) {
  let imageUrl: string | undefined;
  
  if (file) {
    this.cloudinaryService.validateFile(file);
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'categories'
    );
    imageUrl = uploadResult.secure_url;
  }
  
  return this.categoriesService.update(id, {
    ...updateCategoryDto,
    image_url: imageUrl || updateCategoryDto.image_url,
  });
}
```

---

## 🧪 Step 8: Test Image Upload

### Test 1: Create Product with Image

```bash
# Single file upload
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Dell Laptop" \
  -F "sku=DELL-001" \
  -F "description=High-performance laptop" \
  -F "price=1200" \
  -F "stock=50" \
  -F "category_id=cat-uuid" \
  -F "status=active" \
  -F "image=@/path/to/laptop.jpg" \
  http://localhost:3000/api/v1/admin/products

# Response
{
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "id": "product-uuid",
    "name": "Dell Laptop",
    "image_url": "https://res.cloudinary.com/dh7tx8y4n/image/upload/v123456789/shago/products/xyz.jpg",
    // ... other fields
  }
}
```

### Test 2: Update Product Image

```bash
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/new-image.jpg" \
  http://localhost:3000/api/v1/admin/products/product-uuid/image

# Response
{
  "statusCode": 200,
  "message": "Product image updated successfully",
  "data": {
    "id": "product-uuid",
    "image_url": "https://res.cloudinary.com/dh7tx8y4n/image/upload/v123456789/shago/products/abc.jpg",
    // ... other fields
  }
}
```

---

## 🎨 Step 9: Image Optimization Features

### Get Optimized URL

```typescript
// In any service/controller:

// Get thumbnail (200x200)
const thumb = cloudinary.getThumbnailUrl(publicId);
// Returns: https://...w_200,h_200.../image.jpg

// Get custom size
const optimized = cloudinary.getOptimizedUrl(publicId, 800, 600);
// Returns: https://...w_800,h_600.../image.jpg
```

### Example in Frontend

```javascript
// Original full-size image
<img src="https://res.cloudinary.com/.../image.jpg" />

// Thumbnail for list
<img src="https://res.cloudinary.com/.../w_200,h_200/image.jpg" />

// Mobile-optimized
<img src="https://res.cloudinary.com/.../w_400,h_400,c_fill/image.jpg" />

// Auto-optimized format
<img src="https://res.cloudinary.com/.../f_auto,q_auto/image.jpg" />
```

---

## 📁 File Organization on Cloudinary

Your uploaded images will be organized like:

```
shago/
  ├── products/
  │   ├── DELL-001.jpg
  │   ├── LAPTOP-002.jpg
  │   └── ...
  ├── categories/
  │   ├── Electronics.jpg
  │   ├── Clothing.jpg
  │   └── ...
  ├── tenants/
  │   ├── acme-corp-logo.jpg
  │   └── ...
  └── deliveries/
      ├── proof-12345.jpg
      └── ...
```

---

## 🔒 Security Best Practices

### 1. API Secret Protection
```bash
# ✅ GOOD - Store in .env (never commit)
CLOUDINARY_API_SECRET=abc-xyz-123

# ❌ BAD - Hardcode in code
const secret = 'abc-xyz-123';
```

### 2. File Validation
```typescript
// CloudinaryService automatically validates:
✅ File type (JPEG, PNG, WebP, GIF only)
✅ File size (max 5MB)
✅ Returns clear error messages
```

### 3. Signed URLs (Optional)
For extra security, use signed URLs:
```typescript
const signedUrl = cloudinary.url(publicId, {
  sign_url: true,
  type: 'authenticated',
  expiration: 3600, // 1 hour
});
```

---

## 🚫 Error Handling

The CloudinaryService handles errors gracefully:

```typescript
// Invalid file type
{
  "statusCode": 400,
  "message": "Invalid file type. Allowed: image/jpeg, image/png, image/webp, image/gif"
}

// File too large
{
  "statusCode": 400,
  "message": "File too large. Maximum size: 5MB, received: 8.50MB"
}

// Upload failed
{
  "statusCode": 400,
  "message": "Image upload failed: Connection timeout"
}
```

---

## 📊 Cloudinary Dashboard

After uploading images, view them:

1. **Dashboard:** https://cloudinary.com/console
2. **Media Library:** See all uploaded images
3. **Usage:** Check storage used, API calls
4. **Settings:** Manage API keys, security

---

## 💰 Pricing

**Free Tier (Perfect for starting):**
- ✅ 2GB storage
- ✅ 2GB bandwidth/month
- ✅ Unlimited API calls
- ✅ Basic transformations
- ✅ CDN delivery

**Paid Plans (When you scale):**
- $99/month → 100GB storage
- $299/month → 500GB storage
- $999/month → 2TB storage

---

## 🔄 Integration with Multi-Tenancy (Future)

When implementing multi-tenancy, organize by tenant:

```typescript
// Upload with tenant folder
await cloudinaryService.uploadImage(
  file,
  `tenants/${tenantId}/products`  // ← Tenant-specific folder
);

// Result: shago/tenants/acme-uuid/products/image.jpg
```

---

## ✅ Checklist

- [ ] Cloudinary account created
- [ ] Credentials added to .env
- [ ] `npm install cloudinary next-cloudinary`
- [ ] CloudinaryService created ✅
- [ ] Products controller updated with FileInterceptor
- [ ] Products module updated with CloudinaryService
- [ ] Same pattern applied to Categories
- [ ] Test image upload works
- [ ] Verify image URL stored in database
- [ ] Verify image accessible from Cloudinary CDN

---

## 🎯 Result

After setup, you'll have:

✅ **Cloud-based image storage**  
✅ **Automatic CDN delivery** (fast globally)  
✅ **No local disk usage**  
✅ **Automatic optimization**  
✅ **Unlimited scalability**  
✅ **Professional-grade hosting**  

All for **FREE** on the starter tier!

---

## 📞 Troubleshooting

**Issue: "Unauthorized" error**
- Check credentials in .env
- Verify API key and secret are correct
- Restart server after .env changes

**Issue: "Invalid file type"**
- Only JPEG, PNG, WebP, GIF accepted
- Use `convertto` tool to convert if needed

**Issue: "File too large"**
- Max 5MB per file
- Compress before uploading
- Consider server-side compression

**Issue: Image URL not in database**
- Verify Cloudinary upload succeeded
- Check CloudinaryService error handling
- Check network/firewall

---

## 🚀 Next: Apply to All Modules

Apply this pattern to:
- ✅ Products (done)
- ⏳ Categories (similar)
- ⏳ Tenants (logos)
- ⏳ Deliveries (proof images)

---

**Ready to upload to the cloud!** ☁️

