/**
 * Production-Grade Attachment Service
 * Implements Outbox pattern for eventual consistency with Cloudinary
 */

import { prisma } from '@/lib/prisma'
import {
  uploadToCloudinary,
  verifyCloudinaryFile,
  deleteFromCloudinary,
  generateImagePreview,
  compressBuffer,
  decompressBuffer,
} from '@/lib/cloudinary'
import { createAuditEvent } from '@/lib/db-helpers'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_PREVIEW_SIZE = 200 * 1024 // 200KB

interface UploadFileInput {
  file: File
  organizationId: number
  ownerType: string
  ownerId: number
  uploadedBy?: number
}

interface UploadResult {
  id: number
  fileName: string
  fileSize: number
  mimeType: string
  cloudUrl: string | null
  backupAvailable: boolean
  status: string
}

export class AttachmentService {
  /**
   * Upload file with Outbox pattern for resilience
   * Strategy:
   * 1. Try uploading to Cloudinary
   * 2. Generate preview/fallback (thumbnail, compressed, or text snippet)
   * 3. Save metadata + outbox event in transaction
   * 4. Return immediately (outbox processor verifies later)
   */
  async uploadFile(input: UploadFileInput): Promise<UploadResult> {
    const { file, organizationId, ownerType, ownerId, uploadedBy } = input

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
    }

    const fileName = file.name
    const mimeType = file.type
    const fileSize = file.size

    let cloudUrl: string | null = null
    let cloudPublicId: string | null = null
    let backupData: Buffer | null = null
    let backupType: string | null = null
    let status = 'pending_upload'

    try {
      // Step 1: Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file, organizationId.toString(), ownerType)

      cloudUrl = uploadResult.secure_url
      cloudPublicId = uploadResult.public_id
      status = 'active'

      // Step 2: Generate preview/fallback
      const buffer = Buffer.from(await file.arrayBuffer())

      if (mimeType.startsWith('image/')) {
        // Generate thumbnail for images
        backupData = await generateImagePreview(buffer, { maxWidth: 200, quality: 70 })
        backupType = 'thumbnail'
      } else if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
        // Compress for PDFs and text files
        const preview = buffer.slice(0, 50 * 1024) // First 50KB
        backupData = await compressBuffer(preview)
        backupType = 'compressed'
      } else {
        // For other files, store small snippet
        backupData = buffer.slice(0, 10 * 1024) // First 10KB
        backupType = 'snippet'
      }

      // Limit preview size
      if (backupData && backupData.length > MAX_PREVIEW_SIZE) {
        console.warn(`Preview too large (${backupData.length}), skipping backup`)
        backupData = null
        backupType = null
      }
    } catch (uploadError) {
      console.error('Cloudinary upload failed, storing preview only:', uploadError)

      // Fallback: Store preview data and mark as pending
      const buffer = Buffer.from(await file.arrayBuffer())

      if (mimeType.startsWith('image/')) {
        backupData = await generateImagePreview(buffer, { maxWidth: 200, quality: 60 })
        backupType = 'thumbnail'
      } else {
        const preview = buffer.slice(0, 50 * 1024)
        backupData = await compressBuffer(preview)
        backupType = 'compressed'
      }

      status = 'pending_upload' // Will be retried by outbox processor
    }

    // Step 3: Save to database with Outbox event in transaction
    const attachment = await prisma.$transaction(async () => {
      // Create attachment record
      const newAttachment = await prisma.attachment.create({
        data: {
          organizationId,
          ownerType,
          ownerId,
          fileName,
          mimeType,
          fileSize,
          cloudUrl,
          cloudPublicId,
          backupData,
          backupType,
          backupAvailable: !!backupData,
          status,
          uploadedBy,
          uploadedAt: new Date(),
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Create outbox event for verification/retry
      await prisma.outboxEvent.create({
        data: {
          eventType: status === 'active' ? 'UPLOAD_SUCCESS' : 'VERIFY_UPLOAD',
          entityType: 'Attachment',
          entityId: newAttachment.id,
          payload: {
            cloudPublicId,
            cloudUrl,
            fileName,
            mimeType,
            fileSize,
            organizationId,
            ownerType,
            ownerId,
          },
        },
      })

      // Audit log
      await createAuditEvent(
        organizationId,
        'Attachment',
        newAttachment.id,
        'attachment.uploaded',
        {
          fileName,
          fileSize,
          status,
          cloudUrl,
          backupAvailable: !!backupData,
        }
      )

      return newAttachment
    })

    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      cloudUrl: attachment.cloudUrl,
      backupAvailable: attachment.backupAvailable,
      status: attachment.status,
    }
  }

  /**
   * Get attachment metadata by ID
   */
  async getAttachmentById(id: number) {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!attachment) {
      throw new Error('Attachment not found')
    }

    // Don't return binary data in metadata
    const { backupData, ...metadata } = attachment

    return metadata
  }

  /**
   * Get preview/fallback data
   */
  async getPreviewData(id: number) {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      select: {
        backupData: true,
        backupType: true,
        mimeType: true,
        fileName: true,
        backupAvailable: true,
      },
    })

    if (!attachment || !attachment.backupAvailable || !attachment.backupData) {
      throw new Error('Preview not available')
    }

    let data = attachment.backupData

    // Decompress if needed
    if (attachment.backupType === 'compressed') {
      data = await decompressBuffer(data)
    }

    return {
      data,
      mimeType: attachment.mimeType,
      fileName: attachment.fileName,
      backupType: attachment.backupType,
    }
  }

  /**
   * Get fallback data when Cloudinary is unavailable
   */
  async getFallbackData(id: number) {
    return this.getPreviewData(id)
  }

  /**
   * Delete attachment (soft delete)
   */
  async deleteAttachment(id: number, userId?: number) {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    })

    if (!attachment) {
      throw new Error('Attachment not found')
    }

    // Use transaction for consistency
    await prisma.$transaction(async () => {
      // Mark as deleted
      await prisma.attachment.update({
        where: { id },
        data: {
          status: 'deleted',
        },
      })

      // Create outbox event to delete from Cloudinary
      if (attachment.cloudPublicId) {
        await prisma.outboxEvent.create({
          data: {
            eventType: 'DELETE_FILE',
            entityType: 'Attachment',
            entityId: id,
            payload: {
              cloudPublicId: attachment.cloudPublicId,
              organizationId: attachment.organizationId,
            },
          },
        })
      }

      // Audit log
      await createAuditEvent(
        attachment.organizationId,
        'Attachment',
        id,
        'attachment.deleted',
        {
          fileName: attachment.fileName,
          cloudPublicId: attachment.cloudPublicId,
          deletedBy: userId,
        }
      )
    })

    return { success: true }
  }

  /**
   * List attachments by owner
   */
  async listAttachmentsByOwner(ownerType: string, ownerId: number, organizationId?: number) {
    const where: { ownerType: string; ownerId: number; organizationId?: number; status?: string } =
      {
        ownerType,
        ownerId,
        status: 'active', // Only active attachments
      }

    if (organizationId) {
      where.organizationId = organizationId
    }

    const attachments = await prisma.attachment.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        cloudUrl: true,
        backupAvailable: true,
        status: true,
        uploadedAt: true,
        uploadedBy: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return attachments
  }

  /**
   * Verify attachment health (used by outbox processor)
   */
  async verifyAttachment(id: number) {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    })

    if (!attachment || !attachment.cloudPublicId) {
      return { verified: false, status: attachment?.status || 'unknown' }
    }

    const exists = await verifyCloudinaryFile(attachment.cloudPublicId)

    // Update status based on verification
    let newStatus = attachment.status
    if (!exists && attachment.status === 'active') {
      newStatus = attachment.backupAvailable ? 'pending_upload' : 'failed'
    } else if (exists && attachment.status === 'pending_upload') {
      newStatus = 'active'
    }

    if (newStatus !== attachment.status) {
      await prisma.attachment.update({
        where: { id },
        data: {
          status: newStatus,
          lastVerifiedAt: new Date(),
        },
      })
    }

    return {
      verified: exists,
      status: newStatus,
      previousStatus: attachment.status,
    }
  }

  /**
   * Retry failed upload (used by outbox processor)
   */
  async retryUpload(id: number) {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    })

    if (!attachment || attachment.status !== 'pending_upload') {
      throw new Error('Attachment not eligible for retry')
    }

    if (!attachment.backupData) {
      throw new Error('No backup data available for retry')
    }

    try {
      // Retry upload to Cloudinary
      const uploadResult = await uploadToCloudinary(
        attachment.backupData,
        attachment.organizationId.toString(),
        attachment.ownerType
      )

      // Update attachment with Cloudinary data
      await prisma.attachment.update({
        where: { id },
        data: {
          cloudUrl: uploadResult.secure_url,
          cloudPublicId: uploadResult.public_id,
          status: 'active',
          lastVerifiedAt: new Date(),
        },
      })

      return { success: true, cloudUrl: uploadResult.secure_url }
    } catch (error) {
      console.error(`Retry upload failed for ${id}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export const attachmentService = new AttachmentService()
