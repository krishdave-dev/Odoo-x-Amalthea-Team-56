import { NextRequest } from 'next/server'
import { eventService } from '@/services/event.service'
import { successResponse, notFoundResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/admin/events/[id]
 * 
 * Get single event details by ID
 * Query params:
 * - organizationId (required)
 * 
 * RBAC: Admin only (TODO: Add auth middleware)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add RBAC check
    const eventId = idSchema.parse(params.id)
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))

    const event = await eventService.getEventById(eventId, organizationId)

    if (!event) {
      return notFoundResponse('Event')
    }

    return successResponse(event)
  } catch (error) {
    return handleError(error)
  }
}
