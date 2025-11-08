/**
 * Outbox Event Processor
 * Background job to process outbox events for eventual consistency
 * Run this as a cron job or serverless function
 */

import { prisma } from '@/lib/prisma'
import { verifyCloudinaryFile, deleteFromCloudinary } from '@/lib/cloudinary'
import { attachmentService } from '@/services/attachmentService'

const MAX_RETRIES = 3
const BATCH_SIZE = 50

interface ProcessingResult {
  processed: number
  failed: number
  errors: Array<{ eventId: string; error: string }>
}

/**
 * Process unprocessed outbox events
 */
export async function processOutboxEvents(): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    processed: 0,
    failed: 0,
    errors: [],
  }

  try {
    // Get unprocessed events (oldest first)
    const events = await prisma.outboxEvent.findMany({
      where: {
        processed: false,
        retryCount: {
          lt: MAX_RETRIES,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: BATCH_SIZE,
    })

    console.log(`Processing ${events.length} outbox events...`)

    for (const event of events) {
      try {
        await processEvent(event)

        // Mark as processed
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            processed: true,
            processedAt: new Date(),
            error: null,
          },
        })

        result.processed++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Failed to process event ${event.id}:`, errorMessage)

        // Increment retry count
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            retryCount: event.retryCount + 1,
            error: errorMessage,
          },
        })

        result.failed++
        result.errors.push({
          eventId: event.id,
          error: errorMessage,
        })

        // If max retries reached, mark as processed to avoid infinite loop
        if (event.retryCount + 1 >= MAX_RETRIES) {
          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              processed: true,
              processedAt: new Date(),
            },
          })

          // Log critical failure
          console.error(`Event ${event.id} failed after ${MAX_RETRIES} retries`)

          // Create event log for manual review
          await prisma.event.create({
            data: {
              organizationId: (event.payload as any).organizationId || 'system',
              entityType: event.entityType,
              entityId: event.entityId,
              eventType: 'outbox.processing.failed',
              payload: {
                eventType: event.eventType,
                error: errorMessage,
                retries: MAX_RETRIES,
                originalPayload: event.payload,
              },
            },
          })
        }
      }
    }

    console.log(`Outbox processing complete: ${result.processed} processed, ${result.failed} failed`)

    return result
  } catch (error) {
    console.error('Outbox processor error:', error)
    throw error
  }
}

/**
 * Process individual event based on type
 */
async function processEvent(event: any) {
  const { eventType, entityType, entityId, payload } = event

  if (entityType !== 'Attachment') {
    console.warn(`Unsupported entity type: ${entityType}`)
    return
  }

  switch (eventType) {
    case 'UPLOAD_SUCCESS':
      await handleUploadSuccess(entityId, payload)
      break

    case 'VERIFY_UPLOAD':
      await handleVerifyUpload(entityId, payload)
      break

    case 'DELETE_FILE':
      await handleDeleteFile(entityId, payload)
      break

    case 'REPAIR_UPLOAD':
      await handleRepairUpload(entityId, payload)
      break

    default:
      console.warn(`Unsupported event type: ${eventType}`)
  }
}

/**
 * Verify successful upload in Cloudinary
 */
async function handleUploadSuccess(attachmentId: string, payload: any) {
  const { cloudPublicId } = payload

  if (!cloudPublicId) {
    console.warn(`No cloudPublicId for attachment ${attachmentId}`)
    return
  }

  // Verify file exists in Cloudinary
  const exists = await verifyCloudinaryFile(cloudPublicId)

  if (!exists) {
    console.error(`Cloudinary file missing for ${attachmentId}, marking for repair`)

    // Create repair event
    await prisma.outboxEvent.create({
      data: {
        eventType: 'REPAIR_UPLOAD',
        entityType: 'Attachment',
        entityId: attachmentId,
        payload,
      },
    })

    // Update attachment status
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        status: 'pending_upload',
      },
    })
  } else {
    console.log(`Verified attachment ${attachmentId} in Cloudinary`)

    // Update last verified timestamp
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        lastVerifiedAt: new Date(),
      },
    })
  }
}

/**
 * Verify and retry failed uploads
 */
async function handleVerifyUpload(attachmentId: string, payload: any) {
  console.log(`Verifying upload for attachment ${attachmentId}`)

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  })

  if (!attachment) {
    console.warn(`Attachment ${attachmentId} not found`)
    return
  }

  if (attachment.status === 'active' && attachment.cloudPublicId) {
    // Already uploaded successfully
    console.log(`Attachment ${attachmentId} already active`)
    return
  }

  if (attachment.status === 'pending_upload') {
    // Retry upload
    console.log(`Retrying upload for attachment ${attachmentId}`)
    const result = await attachmentService.retryUpload(attachmentId)

    if (!result.success) {
      throw new Error(`Retry failed: ${result.error}`)
    }

    console.log(`Successfully retried upload for ${attachmentId}`)
  }
}

/**
 * Delete file from Cloudinary
 */
async function handleDeleteFile(attachmentId: string, payload: any) {
  const { cloudPublicId } = payload

  if (!cloudPublicId) {
    console.warn(`No cloudPublicId for deletion of ${attachmentId}`)
    return
  }

  try {
    await deleteFromCloudinary(cloudPublicId)
    console.log(`Deleted ${cloudPublicId} from Cloudinary`)
  } catch (error) {
    console.error(`Failed to delete ${cloudPublicId}:`, error)
    // Don't fail the event - file might already be deleted
  }
}

/**
 * Repair missing Cloudinary upload
 */
async function handleRepairUpload(attachmentId: string, payload: any) {
  console.log(`Repairing upload for attachment ${attachmentId}`)

  const result = await attachmentService.retryUpload(attachmentId)

  if (!result.success) {
    throw new Error(`Repair failed: ${result.error}`)
  }

  console.log(`Successfully repaired upload for ${attachmentId}`)
}

/**
 * Clean up old processed events (older than 30 days)
 */
export async function cleanupOldEvents() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const result = await prisma.outboxEvent.deleteMany({
    where: {
      processed: true,
      processedAt: {
        lt: thirtyDaysAgo,
      },
    },
  })

  console.log(`Cleaned up ${result.count} old outbox events`)

  return result.count
}

/**
 * Get outbox statistics
 */
export async function getOutboxStats() {
  const [total, unprocessed, failed] = await Promise.all([
    prisma.outboxEvent.count(),
    prisma.outboxEvent.count({
      where: { processed: false },
    }),
    prisma.outboxEvent.count({
      where: {
        retryCount: {
          gte: MAX_RETRIES,
        },
      },
    }),
  ])

  return {
    total,
    unprocessed,
    failed,
    processed: total - unprocessed,
  }
}
