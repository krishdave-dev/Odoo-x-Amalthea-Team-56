import { NextRequest } from 'next/server'
import { notificationService } from '@/services/notification.service'
import { successResponse, notFoundResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * PATCH /api/notifications/[id]/read
 * 
 * Mark notification as read
 * Query params:
 * - userId (required)
 * 
 * TODO: Get userId from session
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = idSchema.parse(params.id)
    const { searchParams } = new URL(req.url)
    const userId = idSchema.parse(searchParams.get('userId'))

    const success = await notificationService.markAsRead(notificationId, userId)

    if (!success) {
      return notFoundResponse('Notification')
    }

    return successResponse({ message: 'Notification marked as read' })
  } catch (error) {
    return handleError(error)
  }
}
