import { NextRequest } from 'next/server'
import { projectAnalyticsService } from '@/services/analytics/project-analytics.service'
import { cacheService } from '@/services/cache.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/analytics/projects
 * 
 * Get project performance analytics
 * Query params:
 * - organizationId (required)
 * - forceRefresh (optional): Skip cache and recompute
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    // Use cache-aside pattern
    const result = await cacheService.getOrCompute(
      organizationId,
      'project_summary',
      async () => {
        return await projectAnalyticsService.getAnalytics(organizationId)
      },
      { forceRefresh }
    )

    return successResponse({
      ...result.data,
      _meta: {
        cached: result.cached,
        computeDurationMs: result.computeDurationMs,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
