import { NextRequest } from 'next/server'
import { userAnalyticsService } from '@/services/analytics/user-analytics.service'
import { cacheService } from '@/services/cache.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/analytics/users
 * 
 * Get user productivity analytics
 * Query params:
 * - organizationId (required)
 * - startDate (optional)
 * - endDate (optional)
 * - forceRefresh (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    const result = await cacheService.getOrCompute(
      organizationId,
      'user_productivity',
      async () => {
        return await userAnalyticsService.getAnalytics(organizationId, startDate, endDate)
      },
      { forceRefresh }
    )

    return successResponse({
      ...result.data,
      _meta: {
        cached: result.cached,
        computeDurationMs: result.computeDurationMs,
        startDate,
        endDate,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
