import { z } from 'zod'

/**
 * Schema for creating an attachment (hybrid mode)
 */
export const createAttachmentSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  ownerType: z.string().min(1, 'Owner type is required').max(50),
  ownerId: z.string().uuid('Invalid owner ID'),
  fileName: z.string().optional(),
  uploadedBy: z.string().uuid('Invalid user ID').optional(),
  maxBackupSize: z.coerce.number().int().positive().optional().default(5 * 1024 * 1024), // 5MB
  createThumbnail: z.coerce.boolean().optional().default(true),
})

/**
 * Schema for attachment filters
 */
export const attachmentFiltersSchema = z.object({
  organizationId: z.string().uuid().optional(),
  ownerType: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  uploadedBy: z.string().uuid().optional(),
  status: z.enum(['synced', 'backup-only', 'failed', 'orphaned']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional().default('uploadedAt:desc'),
})

/**
 * Schema for verifying attachment health
 */
export const verifyAttachmentSchema = z.object({
  id: z.string().uuid('Invalid attachment ID'),
})

/**
 * Schema for file retrieval with fallback option
 */
export const fileRetrievalSchema = z.object({
  id: z.string().uuid('Invalid attachment ID'),
  fallback: z.coerce.boolean().optional().default(false),
})

/**
 * Type inference from schemas
 */
export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>
export type AttachmentFilters = z.infer<typeof attachmentFiltersSchema>
export type VerifyAttachmentInput = z.infer<typeof verifyAttachmentSchema>
export type FileRetrievalInput = z.infer<typeof fileRetrievalSchema>

