import { NextRequest } from 'next/server'
import { notificationService } from '@/services/notification.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/notifications
 * 
 * Get user notifications with optional filters
 * Query params:
 * - userId (required)
 * - unreadOnly (optional, boolean)
 * - type (optional)
 * - page (optional, default: 1)
 * - pageSize (optional, default: 50)
 * 
 * TODO: Get userId from session instead of query param
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // TODO: Get from authenticated session
    // const session = await getSession()
    // const userId = session.user.id
    const userId = idSchema.parse(searchParams.get('userId'))

    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 50

    const result = await notificationService.getUserNotifications({
      userId,
      unreadOnly: searchParams.get('unreadOnly') === 'true',
      type: searchParams.get('type') || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })

    return successResponse(result)
  } catch (error) {
    return handleError(error)
  }
}
