/**
 * Production-Grade Cloudinary Service
 * Handles file uploads with streaming, verification, and retry logic
 */

import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'
import sharp from 'sharp'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
})

export interface UploadResult {
  secure_url: string
  public_id: string
  original_filename: string
  bytes: number
  format: string
  resource_type: string
  width?: number
  height?: number
}

export interface PreviewOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

/**
 * Upload file to Cloudinary with folder structure
 * @param file - File to upload
 * @param organizationId - Organization ID for folder structure
 * @param ownerType - Entity type (task, project, etc.)
 * @returns Upload result with metadata
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  organizationId: string,
  ownerType: string
): Promise<UploadResult> {
  try {
    // Convert to buffer
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file

    // Folder structure: oneflow/{organizationId}/{ownerType}
    const folder = `${process.env.CLOUDINARY_FOLDER || 'oneflow'}/${organizationId}/${ownerType.toLowerCase()}`

    return await new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          timeout: 120000, // 2 minutes timeout
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`))
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              original_filename: result.original_filename || 'unknown',
              bytes: result.bytes,
              format: result.format,
              resource_type: result.resource_type,
              width: result.width,
              height: result.height,
            })
          } else {
            reject(new Error('Cloudinary upload failed: No result returned'))
          }
        }
      )

      const stream = Readable.from(buffer)
      stream.pipe(uploadStream)
    })
  } catch (error) {
    throw new Error(
      `Failed to upload to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Verify if file exists in Cloudinary
 * @param publicId - Cloudinary public_id
 * @returns True if file exists and is accessible
 */
export async function verifyCloudinaryFile(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'auto',
    })
    return result && result.secure_url !== undefined
  } catch (error) {
    console.error(`Cloudinary verification failed for ${publicId}:`, error)
    return false
  }
}

/**
 * Delete file from Cloudinary
 * @param publicId - Cloudinary public_id
 * @returns Deletion result
 */
export async function deleteFromCloudinary(publicId: string): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'auto',
      invalidate: true, // Invalidate CDN cache
    })
    return result
  } catch (error) {
    throw new Error(
      `Failed to delete from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate thumbnail preview for images
 * @param buffer - Image buffer
 * @param options - Preview options
 * @returns Compressed thumbnail buffer
 */
export async function generateImagePreview(
  buffer: Buffer,
  options: PreviewOptions = {}
): Promise<Buffer> {
  const { maxWidth = 200, maxHeight = 200, quality = 70, format = 'jpeg' } = options

  try {
    return await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(format, { quality })
      .toBuffer()
  } catch (error) {
    throw new Error(
      `Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Compress buffer using gzip for text/document fallback
 * @param buffer - Original buffer
 * @returns Compressed buffer
 */
export async function compressBuffer(buffer: Buffer): Promise<Buffer> {
  const { gzip } = await import('zlib')
  const { promisify } = await import('util')
  const gzipAsync = promisify(gzip)

  try {
    return await gzipAsync(buffer)
  } catch (error) {
    throw new Error(
      `Failed to compress buffer: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Decompress gzip buffer
 * @param buffer - Compressed buffer
 * @returns Decompressed buffer
 */
export async function decompressBuffer(buffer: Buffer): Promise<Buffer> {
  const { gunzip } = await import('zlib')
  const { promisify } = await import('util')
  const gunzipAsync = promisify(gunzip)

  try {
    return await gunzipAsync(buffer)
  } catch (error) {
    throw new Error(
      `Failed to decompress buffer: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Extract public_id from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Extracted public_id
 */
export function extractPublicId(url: string): string {
  try {
    const cleanUrl = url.split('?')[0]
    const parts = cleanUrl.split('/')
    const uploadIndex = parts.findIndex((part) => part === 'upload')

    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL format')
    }

    const pathAfterUpload = parts.slice(uploadIndex + 2).join('/')
    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '')

    return publicId
  } catch {
    throw new Error('Invalid Cloudinary URL')
  }
}

/**
 * Get optimized image URL with transformations
 * @param publicId - Cloudinary public_id
 * @param options - Transformation options
 * @returns Transformed URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number
    height?: number
    quality?: number | 'auto'
    format?: string
  }
): string {
  return cloudinary.url(publicId, {
    ...options,
    secure: true,
    fetch_format: options?.format || 'auto',
    quality: options?.quality || 'auto',
  })
}

export { cloudinary }
