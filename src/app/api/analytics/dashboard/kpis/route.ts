import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'
import { getCurrentUser } from '@/lib/session'
import { Prisma } from '@prisma/client'

/**
 * GET /api/analytics/dashboard/kpis
 * 
 * Get KPI metrics for dashboard based on user role:
 * - Admin: All organization data
 * - Manager: Data for projects they manage or are members of
 * - Member: Data for tasks/projects assigned to them
 * 
 * Query params:
 * - organizationId (required): Organization ID
 */
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return errorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))

    // Verify user belongs to the organization
    if (currentUser.organizationId !== organizationId) {
      return errorResponse('Forbidden', 403)
    }

    let activeProjectsCount: number
    let delayedTasksCount: number
    let totalHoursLogged: number
    let totalRevenue: number

    // Role-based data filtering
    if (currentUser.role === 'admin') {
      // Admin: See ALL organization data
      const [projectsCount, tasksCount, hoursData, invoiceData, expenseData] = await Promise.all([
        // All active projects
        prisma.project.count({
          where: {
            organizationId,
            status: 'active',
            deletedAt: null,
          },
        }),

        // All delayed tasks
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

        // All hours logged
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

        // All revenue from invoices
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

        // All revenue from billable expenses
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
      ])

      activeProjectsCount = projectsCount
      delayedTasksCount = tasksCount
      totalHoursLogged = Number(hoursData._sum.durationHours || 0)
      const invoiceRevenue = Number(invoiceData._sum.amount || 0)
      const billableExpenses = Number(expenseData._sum.amount || 0)
      totalRevenue = invoiceRevenue + billableExpenses

    } else if (currentUser.role === 'manager') {
      // Manager: Projects they manage or are members of
      const projectFilter: Prisma.ProjectWhereInput = {
        organizationId,
        status: 'active',
        deletedAt: null,
        OR: [
          { projectManagerId: currentUser.id },
          {
            members: {
              some: {
                userId: currentUser.id,
              },
            },
          },
        ],
      }

      const [projectsCount, tasksCount, hoursData, invoiceData, expenseData] = await Promise.all([
        // Active projects managed by or assigned to manager
        prisma.project.count({
          where: projectFilter,
        }),

        // Delayed tasks in manager's projects
        prisma.task.count({
          where: {
            project: {
              organizationId,
              deletedAt: null,
              OR: [
                { projectManagerId: currentUser.id },
                {
                  members: {
                    some: {
                      userId: currentUser.id,
                    },
                  },
                },
              ],
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

        // Hours logged in manager's projects
        prisma.timesheet.aggregate({
          where: {
            project: {
              organizationId,
              deletedAt: null,
              OR: [
                { projectManagerId: currentUser.id },
                {
                  members: {
                    some: {
                      userId: currentUser.id,
                    },
                  },
                },
              ],
            },
            deletedAt: null,
          },
          _sum: {
            durationHours: true,
          },
        }),

        // Revenue from manager's projects - invoices
        prisma.customerInvoice.aggregate({
          where: {
            organizationId,
            status: 'paid',
            deletedAt: null,
            project: {
              OR: [
                { projectManagerId: currentUser.id },
                {
                  members: {
                    some: {
                      userId: currentUser.id,
                    },
                  },
                },
              ],
            },
          },
          _sum: {
            amount: true,
          },
        }),

        // Revenue from manager's projects - expenses
        prisma.expense.aggregate({
          where: {
            organizationId,
            billable: true,
            status: {
              in: ['approved', 'paid'],
            },
            deletedAt: null,
            project: {
              OR: [
                { projectManagerId: currentUser.id },
                {
                  members: {
                    some: {
                      userId: currentUser.id,
                    },
                  },
                },
              ],
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ])

      activeProjectsCount = projectsCount
      delayedTasksCount = tasksCount
      totalHoursLogged = Number(hoursData._sum.durationHours || 0)
      const invoiceRevenue = Number(invoiceData._sum.amount || 0)
      const billableExpenses = Number(expenseData._sum.amount || 0)
      totalRevenue = invoiceRevenue + billableExpenses

    } else {
      // Member: Only their own data
      const [projectsCount, tasksCount, hoursData, user] = await Promise.all([
        // Active projects they're assigned to
        prisma.project.count({
          where: {
            organizationId,
            status: 'active',
            deletedAt: null,
            members: {
              some: {
                userId: currentUser.id,
              },
            },
          },
        }),

        // Their own delayed tasks
        prisma.task.count({
          where: {
            project: {
              organizationId,
              deletedAt: null,
            },
            assigneeId: currentUser.id,
            dueDate: {
              lt: new Date(),
            },
            status: {
              notIn: ['completed', 'done', 'closed'],
            },
            deletedAt: null,
          },
        }),

        // Their own hours logged
        prisma.timesheet.aggregate({
          where: {
            userId: currentUser.id,
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

        // Get user's hourly rate for revenue calculation
        prisma.user.findUnique({
          where: { id: currentUser.id },
          select: { hourlyRate: true },
        }),
      ])

      activeProjectsCount = projectsCount
      delayedTasksCount = tasksCount
      totalHoursLogged = Number(hoursData._sum.durationHours || 0)
      
      // Calculate revenue based on hours logged * hourly rate
      const hourlyRate = Number(user?.hourlyRate || 0)
      totalRevenue = totalHoursLogged * hourlyRate
    }

    return successResponse({
      activeProjects: activeProjectsCount,
      delayedTasks: delayedTasksCount,
      hoursLogged: totalHoursLogged,
      revenueEarned: totalRevenue,
    })
  } catch (error) {
    return handleError(error)
  }
}
