import { NextRequest } from 'next/server'
import { notificationService } from '@/services/notification.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * POST /api/notifications/mark-all-read
 * 
 * Mark all notifications as read for user
 * Body:
 * - userId (required)
 * 
 * TODO: Get userId from session
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = idSchema.parse(body.userId)

    const count = await notificationService.markAllAsRead(userId)

    return successResponse({
      message: `Marked ${count} notifications as read`,
      count,
    })
  } catch (error) {
    return handleError(error)
  }
}
