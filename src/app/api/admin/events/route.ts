import { NextRequest } from 'next/server'
import { eventService } from '@/services/event.service'
import { successResponse, paginatedResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/admin/events
 * 
 * Get audit events with filtering and pagination
 * Query params:
 * - organizationId (required)
 * - entityType (optional)
 * - entityId (optional)
 * - eventType (optional)
 * - fromDate (optional)
 * - toDate (optional)
 * - userId (optional) - filters by userId in payload
 * - page (optional, default: 1)
 * - pageSize (optional, default: 50)
 * 
 * RBAC: Admin only (TODO: Add auth middleware)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // TODO: Add RBAC check
    // const session = await getSession()
    // if (session.user.role !== 'admin') {
    //   return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 403 })
    // }

    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    
    const filters = {
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') ? parseInt(searchParams.get('entityId')!) : undefined,
      eventType: searchParams.get('eventType') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      userId: searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 50,
    }

    const result = await eventService.getEventsPaginated(organizationId, filters)

    return paginatedResponse({
      data: result.events,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
