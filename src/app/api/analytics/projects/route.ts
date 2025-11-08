import { NextRequest } from 'next/server'
import { projectAnalyticsService } from '@/services/analytics/project-analytics.service'
import { cacheService } from '@/services/cache.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'
import { withAuth, getOrganizationId } from '@/lib/middleware/auth'

/**
 * GET /api/analytics/projects
 * 
 * Get project performance analytics
 * Query params:
 * - forceRefresh (optional): Skip cache and recompute
 * 
 * Permissions: All authenticated users (filtered by org)
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const organizationId = getOrganizationId(user!)
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
