import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/analytics/dashboard/kpis
 * 
 * Get KPI metrics for dashboard
 * Query params:
 * - organizationId (required): Organization ID
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))

    // Fetch all KPI data in parallel
    const [
      activeProjectsCount,
      delayedTasksData,
      hoursLoggedData,
      revenueData,
    ] = await Promise.all([
      // Active projects count
      prisma.project.count({
        where: {
          organizationId,
          status: 'active',
          deletedAt: null,
        },
      }),

      // Delayed tasks (tasks with due date in the past and not completed)
      prisma.task.count({
        where: {
          project: {
            organizationId,
            deletedAt: null,
          },
          dueDate: {
            lt: new Date(),
          },
          status: {
            notIn: ['completed', 'done', 'closed'],
          },
          deletedAt: null,
        },
      }),

      // Hours logged (sum of all timesheet duration)
      prisma.timesheet.aggregate({
        where: {
          project: {
            organizationId,
            deletedAt: null,
          },
          deletedAt: null,
        },
        _sum: {
          durationHours: true,
        },
      }),

      // Revenue earned (sum of paid customer invoices + billable approved/paid expenses)
      Promise.all([
        // Customer invoices that are paid
        prisma.customerInvoice.aggregate({
          where: {
            organizationId,
            status: 'paid',
            deletedAt: null,
          },
          _sum: {
            amount: true,
          },
        }),
        // Billable expenses that are approved or paid
        prisma.expense.aggregate({
          where: {
            organizationId,
            billable: true,
            status: {
              in: ['approved', 'paid'],
            },
            deletedAt: null,
          },
          _sum: {
            amount: true,
          },
        }),
      ]),
    ])

    const totalHoursLogged = Number(hoursLoggedData._sum.durationHours || 0)
    const totalInvoiceRevenue = Number(revenueData[0]._sum.amount || 0)
    const totalBillableExpenses = Number(revenueData[1]._sum.amount || 0)
    const totalRevenue = totalInvoiceRevenue + totalBillableExpenses

    return successResponse({
      activeProjects: activeProjectsCount,
      delayedTasks: delayedTasksData,
      hoursLogged: totalHoursLogged,
      revenueEarned: totalRevenue,
    })
  } catch (error) {
    return handleError(error)
  }
}
