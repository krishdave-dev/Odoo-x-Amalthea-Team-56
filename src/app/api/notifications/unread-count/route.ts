import { NextRequest } from 'next/server'
import { notificationService } from '@/services/notification.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/notifications/unread-count
 * 
 * Get count of unread notifications for user
 * Query params:
 * - userId (required)
 * 
 * TODO: Get userId from session
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = idSchema.parse(searchParams.get('userId'))

    const count = await notificationService.getUnreadCount(userId)

    return successResponse({ unreadCount: count })
  } catch (error) {
    return handleError(error)
  }
}
