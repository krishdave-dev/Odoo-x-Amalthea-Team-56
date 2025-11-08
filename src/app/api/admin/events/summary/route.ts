import { NextRequest } from 'next/server'
import { eventService } from '@/services/event.service'
import { cacheService } from '@/services/cache.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/admin/events/summary
 * 
 * Get aggregated event analytics for admin dashboard
 * Query params:
 * - organizationId (required)
 * - forceRefresh (optional): Skip cache
 * 
 * RBAC: Admin only (TODO: Add auth middleware)
 * 
 * Response:
 * - Total events (all time, today, this week, this month)
 * - Top entities by event count
 * - Top event types
 * - Activity trend (last 14 days)
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Add RBAC check
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    // Use caching for summary (5 min TTL)
    const result = await cacheService.getOrCompute(
      organizationId,
      'organization_dashboard', // Reuse existing cache type
      async () => {
        return await eventService.getEventSummary(organizationId)
      },
      {
        forceRefresh,
        memoryTTL: 5 * 60 * 1000, // 5 minutes
        dbTTL: 10 * 60 * 1000, // 10 minutes
      }
    )

    return successResponse({
      ...result.data,
      _meta: {
        cached: result.cached,
        computeDurationMs: result.computeDurationMs,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
