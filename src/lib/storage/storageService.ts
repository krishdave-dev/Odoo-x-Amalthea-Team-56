/**
 * Hybrid Storage Service
 * Manages file uploads to Cloudinary with PostgreSQL fallback
 */

import { uploadToCloudinary, deleteFromCloudinary, verifyCloudinaryFile } from './cloudinary';
import sharp from 'sharp';

export type StorageBackend = 'cloudinary' | 'postgres' | 'hybrid';

export interface UploadResult {
  cloudUrl?: string;
  cloudPublicId?: string;
  backupData?: Buffer;
  backupAvailable: boolean;
  status: 'synced' | 'backup-only' | 'failed';
  fileSize: number;
  mimeType: string;
  fileName: string;
}

export interface UploadOptions {
  organizationId: string;
  ownerType: string;
  maxBackupSize?: number; // Max size for backup in bytes (default: 5MB)
  createThumbnail?: boolean; // Create compressed thumbnail for images
}

/**
 * Upload file with hybrid Cloudinary + PostgreSQL fallback
 * 
 * Strategy:
 * 1. Try uploading to Cloudinary first
 * 2. On success: optionally create small backup/thumbnail
 * 3. On failure: store full file in PostgreSQL as backup
 */
export async function uploadFileHybrid(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const { organizationId, ownerType, maxBackupSize = 5 * 1024 * 1024 } = options;

  const fileName = file.name;
  const mimeType = file.type;
  const fileSize = file.size;

  let cloudUrl: string | undefined;
  let cloudPublicId: string | undefined;
  let backupData: Buffer | undefined;
  let backupAvailable = false;
  let status: 'synced' | 'backup-only' | 'failed' = 'failed';

  try {
    // Primary: Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(file, organizationId, ownerType);

    cloudUrl = cloudinaryResult.secure_url;
    cloudPublicId = cloudinaryResult.public_id;
    status = 'synced';

    // Optional: Create small backup/thumbnail for quick fallback
    if (fileSize <= maxBackupSize) {
      try {
        backupData = await createBackupData(file, mimeType);
        backupAvailable = !!backupData;
      } catch (error) {
        console.warn('Failed to create backup data:', error);
        // Don't fail the upload if backup creation fails
      }
    }

    return {
      cloudUrl,
      cloudPublicId,
      backupData,
      backupAvailable,
      status,
      fileSize,
      mimeType,
      fileName,
    };
  } catch (cloudinaryError) {
    console.error('Cloudinary upload failed, falling back to PostgreSQL:', cloudinaryError);

    // Fallback: Store in PostgreSQL
    try {
      const arrayBuffer = await file.arrayBuffer();
      backupData = Buffer.from(arrayBuffer);
      backupAvailable = true;
      status = 'backup-only';

      return {
        cloudUrl: undefined,
        cloudPublicId: undefined,
        backupData,
        backupAvailable,
        status,
        fileSize,
        mimeType,
        fileName,
      };
    } catch (postgresError) {
      console.error('PostgreSQL fallback also failed:', postgresError);

      return {
        cloudUrl: undefined,
        cloudPublicId: undefined,
        backupData: undefined,
        backupAvailable: false,
        status: 'failed',
        fileSize,
        mimeType,
        fileName,
      };
    }
  }
}

/**
 * Create compressed backup data for small files or thumbnails
 */
async function createBackupData(file: File, mimeType: string): Promise<Buffer | undefined> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // For images, create compressed thumbnail
  if (mimeType.startsWith('image/')) {
    try {
      const thumbnail = await sharp(buffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();

      return thumbnail;
    } catch (error) {
      console.warn('Failed to create image thumbnail:', error);
      // If compression fails, store original if small enough
      if (buffer.length <= 1024 * 1024) {
        // 1MB limit for non-compressed
        return buffer;
      }
    }
  }

  // For small non-image files, store as-is
  if (buffer.length <= 1024 * 1024) {
    // 1MB limit
    return buffer;
  }

  return undefined;
}

/**
 * Upload directly to PostgreSQL (bypass Cloudinary)
 */
export async function uploadToPostgres(file: File): Promise<{ buffer: Buffer }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return { buffer };
}

/**
 * Verify Cloudinary file health
 */
export async function verifyFileHealth(publicId: string): Promise<boolean> {
  try {
    return await verifyCloudinaryFile(publicId);
  } catch {
    return false;
  }
}

/**
 * Delete file from storage (Cloudinary + PostgreSQL cleanup)
 */
export async function deleteFileHybrid(
  cloudPublicId?: string
): Promise<{ cloudinaryDeleted: boolean; status: 'deleted' | 'orphaned' }> {
  let cloudinaryDeleted = false;

  if (cloudPublicId) {
    try {
      await deleteFromCloudinary(cloudPublicId);
      cloudinaryDeleted = true;
    } catch (error) {
      console.error('Failed to delete from Cloudinary:', error);
      // Continue to delete from DB even if Cloudinary fails
    }
  }

  return {
    cloudinaryDeleted,
    status: cloudinaryDeleted ? 'deleted' : 'orphaned',
  };
}

/**
 * Get storage backend mode from environment
 */
export function getStorageBackend(): StorageBackend {
  const backend = process.env.STORAGE_BACKEND?.toLowerCase();

  if (backend === 'cloudinary' || backend === 'postgres' || backend === 'hybrid') {
    return backend as StorageBackend;
  }

  return 'hybrid'; // Default to hybrid mode
}
