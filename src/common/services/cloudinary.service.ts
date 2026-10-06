import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Multer } from 'multer';

/**
 * Cloudinary Service
 *
 * Handles all image uploads to Cloudinary
 * Supports:
 * - Product images
 * - Category images
 * - Tenant logos
 * - Delivery proof images
 *
 * Configuration:
 * CLOUDINARY_CLOUD_NAME=your_cloud_name
 * CLOUDINARY_API_KEY=your_api_key
 * CLOUDINARY_API_SECRET=your_api_secret
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload image to Cloudinary
   *
   * @param file - Express file object
   * @param folder - Cloudinary folder (e.g., 'products', 'categories', 'tenants')
   * @param publicId - Optional public ID for the image
   * @returns Upload response with secure URL
   */
  async uploadImage(
    file: Multer.File,
    folder: string,
    publicId?: string,
  ): Promise<UploadApiResponse> {
    try {
      if (!file || !file.buffer) {
        throw new BadRequestException('No file provided');
      }

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `shago/${folder}`, // e.g., 'shago/products'
            public_id: publicId,
            resource_type: 'auto',
            timeout: 60000,
          },
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              this.logger.error(
                `Cloudinary upload failed for folder ${folder}:`,
                error.message,
              );
              reject(
                new BadRequestException(
                  `Image upload failed: ${error.message}`,
                ),
              );
            } else if (result) {
              this.logger.log(
                `Image uploaded successfully: ${result.secure_url}`,
              );
              resolve(result);
            } else {
              reject(new BadRequestException('Upload failed: No result'));
            }
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error('Cloudinary upload error:', error.message);
      throw new BadRequestException(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(
    files: Multer.File[],
    folder: string,
  ): Promise<UploadApiResponse[]> {
    const uploadPromises = files.map((file) =>
      this.uploadImage(file, folder),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        this.logger.log(`Image deleted: ${publicId}`);
      } else {
        this.logger.warn(`Image not found: ${publicId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete image ${publicId}:`, error.message);
      throw new BadRequestException(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Get image URL with transformations
   */
  getOptimizedUrl(publicId: string, width?: number, height?: number): string {
    let url = cloudinary.url(publicId, {
      secure: true,
    });

    if (width || height) {
      url = cloudinary.url(publicId, {
        secure: true,
        width: width,
        height: height,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      });
    }

    return url;
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      secure: true,
      width: 200,
      height: 200,
      crop: 'fill',
      quality: 'auto',
    });
  }

  /**
   * Validate file before upload
   */
  validateFile(file: Multer.File): boolean {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedMimes.join(', ')}`,
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size: 5MB, received: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    return true;
  }
}
