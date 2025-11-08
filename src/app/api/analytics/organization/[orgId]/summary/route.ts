import { NextRequest } from 'next/server'
import { projectAnalyticsService } from '@/services/analytics/project-analytics.service'
import { timesheetAnalyticsService } from '@/services/analytics/timesheet-analytics.service'
import { expenseAnalyticsService } from '@/services/analytics/expense-analytics.service'
import { financeAnalyticsService } from '@/services/analytics/finance-analytics.service'
import { userAnalyticsService } from '@/services/analytics/user-analytics.service'
import { cacheService } from '@/services/cache.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/analytics/organization/[orgId]/summary
 * 
 * Get complete organization dashboard summary
 * Combines all analytics into one response
 * Query params:
 * - forceRefresh (optional): Skip cache and recompute all metrics
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const organizationId = idSchema.parse(params.orgId)
    const { searchParams } = new URL(req.url)
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    const result = await cacheService.getOrCompute(
      organizationId,
      'organization_dashboard',
      async () => {
        // Compute all analytics in parallel
        const [
          projects,
          timesheets,
          expenses,
          finance,
          users,
          revenueVsCost,
        ] = await Promise.all([
          projectAnalyticsService.getAnalytics(organizationId),
          timesheetAnalyticsService.getAnalytics(organizationId),
          expenseAnalyticsService.getAnalytics(organizationId),
          financeAnalyticsService.getAnalytics(organizationId),
          userAnalyticsService.getAnalytics(organizationId),
          financeAnalyticsService.getRevenueVsCost(organizationId),
        ])

        return {
          projects: {
            summary: projects.summary,
            byStatus: projects.byStatus,
            health: projects.health,
          },
          timesheets: {
            summary: timesheets.summary,
            topUsers: timesheets.topUsers.slice(0, 3), // Top 3 for dashboard
          },
          expenses: {
            summary: expenses.summary,
            byStatus: expenses.byStatus,
          },
          finance: {
            salesOrders: finance.salesOrders,
            purchaseOrders: finance.purchaseOrders,
            invoices: finance.invoices,
            bills: finance.bills,
            workingCapital: finance.workingCapital,
            revenueVsCost,
          },
          users: {
            totalUsers: users.totalUsers,
            activeUsers: users.activeUsers,
            avgCompletionRate: users.avgCompletionRate,
            avgUtilizationRate: users.avgUtilizationRate,
          },
        }
      },
      { forceRefresh }
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
