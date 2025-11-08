import { NextRequest } from 'next/server'
import { financeAnalyticsService } from '@/services/analytics/finance-analytics.service'
import { cacheService } from '@/services/cache.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/analytics/finance
 * 
 * Get financial documents analytics (SO, PO, Invoices, Bills, Cashflow)
 * Query params:
 * - organizationId (required)
 * - forceRefresh (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    const result = await cacheService.getOrCompute(
      organizationId,
      'finance_summary',
      async () => {
        return await financeAnalyticsService.getAnalytics(organizationId)
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
