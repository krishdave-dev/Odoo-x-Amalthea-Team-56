import { NextRequest } from 'next/server'
import { notificationService } from '@/services/notification.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { z } from 'zod'

const broadcastSchema = z.object({
  organizationId: z.number(),
  type: z.string(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
})

/**
 * POST /api/admin/notifications/broadcast
 * 
 * Send broadcast notification to all users in organization
 * Body:
 * - organizationId (required)
 * - type (required)
 * - title (required)
 * - message (required)
 * - data (optional)
 * 
 * RBAC: Admin only (TODO: Add auth middleware)
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add RBAC check
    const body = await req.json()
    const params = broadcastSchema.parse(body)

    await notificationService.broadcastToOrganization(
      params.organizationId,
      params.type,
      params.title,
      params.message,
      params.data
    )

    return successResponse({
      success: true,
      message: 'Broadcast notification sent successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
