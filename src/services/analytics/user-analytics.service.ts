/**
 * UserAnalyticsService - User Productivity & Workload Metrics
 * 
 * Computes:
 * - Hours logged per user
 * - Task completion rates
 * - Expense submission rates
 * - Workload distribution
 */

import { prisma } from '@/lib/prisma'

export interface UserProductivityMetrics {
  userId: number
  userName: string
  hoursLogged: number
  tasksAssigned: number
  tasksCompleted: number
  completionRate: number
  expensesSubmitted: number
  expensesApproved: number
  utilizationRate: number
}

export interface UserAnalyticsResponse {
  totalUsers: number
  activeUsers: number
  topPerformers: UserProductivityMetrics[]
  avgCompletionRate: number
  avgUtilizationRate: number
  workloadDistribution: Array<{
    userId: number
    userName: string
    tasksAssigned: number
    hoursLogged: number
  }>
}

export class UserAnalyticsService {
  /**
   * Get user productivity analytics
   */
  static async getAnalytics(
    organizationId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<UserAnalyticsResponse> {
    // Default to last 30 days
    if (!endDate) {
      endDate = new Date()
    }
    if (!startDate) {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
    }

    // Get all active users in organization
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    })

    const userMetrics: UserProductivityMetrics[] = []

    for (const user of users) {
      // Get timesheet data
      const timesheets = await prisma.timesheet.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          durationHours: true,
        },
      })

      const hoursLogged = timesheets.reduce((sum: number, t: any) => sum + Number(t.durationHours), 0)

      // Get task data
      const [tasksAssigned, tasksCompleted] = await Promise.all([
        prisma.task.count({
          where: {
            assigneeId: user.id,
            deletedAt: null,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        prisma.task.count({
          where: {
            assigneeId: user.id,
            deletedAt: null,
            status: 'done',
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      ])

      const completionRate = tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0

      // Get expense data
      const [expensesSubmitted, expensesApproved] = await Promise.all([
        prisma.expense.count({
          where: {
            userId: user.id,
            deletedAt: null,
            status: {
              in: ['submitted', 'approved', 'paid'],
            },
            submittedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        prisma.expense.count({
          where: {
            userId: user.id,
            deletedAt: null,
            status: {
              in: ['approved', 'paid'],
            },
            approvedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      ])

      // Calculate utilization rate (assuming 8 hour workday, 5 days/week)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const workingDays = Math.floor(daysDiff * 5 / 7)
      const availableHours = workingDays * 8
      const utilizationRate = availableHours > 0 ? (hoursLogged / availableHours) * 100 : 0

      userMetrics.push({
        userId: user.id,
        userName: user.name || `User ${user.id}`,
        hoursLogged: Math.round(hoursLogged * 100) / 100,
        tasksAssigned,
        tasksCompleted,
        completionRate: Math.round(completionRate * 100) / 100,
        expensesSubmitted,
        expensesApproved,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
      })
    }

    // Filter active users (logged any hours in period)
    const activeUsers = userMetrics.filter(u => u.hoursLogged > 0).length

    // Top 5 performers by completion rate
    const topPerformers = [...userMetrics]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5)

    // Average metrics
    const avgCompletionRate = userMetrics.length > 0
      ? userMetrics.reduce((sum, u) => sum + u.completionRate, 0) / userMetrics.length
      : 0

    const avgUtilizationRate = userMetrics.length > 0
      ? userMetrics.reduce((sum, u) => sum + u.utilizationRate, 0) / userMetrics.length
      : 0

    // Workload distribution (sorted by tasks assigned)
    const workloadDistribution = [...userMetrics]
      .sort((a, b) => b.tasksAssigned - a.tasksAssigned)
      .map(u => ({
        userId: u.userId,
        userName: u.userName,
        tasksAssigned: u.tasksAssigned,
        hoursLogged: u.hoursLogged,
      }))

    return {
      totalUsers: users.length,
      activeUsers,
      topPerformers,
      avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
      avgUtilizationRate: Math.round(avgUtilizationRate * 100) / 100,
      workloadDistribution,
    }
  }

  /**
   * Get individual user performance
   */
  static async getUserPerformance(
    userId: number,
    organizationId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    hoursLogged: number
    tasksCompleted: number
    tasksInProgress: number
    taskCompletionRate: number
    expensesSubmitted: number
    avgExpenseAmount: number
    projectsContributed: number
  }> {
    if (!endDate) {
      endDate = new Date()
    }
    if (!startDate) {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
    }

    // Verify user belongs to organization
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
    })

    if (!user) {
      throw new Error('User not found in organization')
    }

    // Hours logged
    const timesheets = await prisma.timesheet.findMany({
      where: {
        userId,
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        durationHours: true,
        projectId: true,
      },
    })

    const hoursLogged = timesheets.reduce((sum: number, t: any) => sum + Number(t.durationHours), 0)
    const projectsContributed = new Set(timesheets.map((t: any) => t.projectId)).size

    // Tasks
    const [tasksCompleted, tasksInProgress, totalTasks] = await Promise.all([
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'done',
          deletedAt: null,
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'in_progress',
          deletedAt: null,
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          deletedAt: null,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ])

    const taskCompletionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0

    // Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
      },
    })

    const expensesSubmitted = expenses.length
    const totalExpenseAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
    const avgExpenseAmount = expensesSubmitted > 0 ? totalExpenseAmount / expensesSubmitted : 0

    return {
      hoursLogged: Math.round(hoursLogged * 100) / 100,
      tasksCompleted,
      tasksInProgress,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      expensesSubmitted,
      avgExpenseAmount: Math.round(avgExpenseAmount * 100) / 100,
      projectsContributed,
    }
  }
}

export const userAnalyticsService = UserAnalyticsService
