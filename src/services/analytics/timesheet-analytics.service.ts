/**
 * TimesheetAnalyticsService - Time Tracking & Productivity Metrics
 * 
 * Computes:
 * - Total hours logged (billable vs non-billable)
 * - Average hourly rate
 * - Top users by hours
 * - Weekly/monthly trends
 * - Utilization rates
 */

import { prisma } from '@/lib/prisma'

export interface TimesheetSummary {
  totalHours: number
  billableHours: number
  nonBillableHours: number
  avgHourlyRate: number
  billablePercentage: number
  totalCost: number
  estimatedRevenue: number
}

export interface TopUser {
  userId: number
  userName: string
  hours: number
  billableHours: number
  cost: number
}

export interface WeeklyTrend {
  week: string // ISO week format: YYYY-Www
  hours: number
  billableHours: number
  cost: number
}

export interface TimesheetAnalyticsResponse {
  summary: TimesheetSummary
  topUsers: TopUser[]
  weeklyTrend: WeeklyTrend[]
}

export class TimesheetAnalyticsService {
  /**
   * Get timesheet analytics for an organization
   * @param organizationId - Organization ID
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   */
  static async getAnalytics(
    organizationId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimesheetAnalyticsResponse> {
    // Default to last 30 days if no dates provided
    if (!endDate) {
      endDate = new Date()
    }
    if (!startDate) {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
    }

    // Fetch timesheets with user info
    const timesheets = await prisma.timesheet.findMany({
      where: {
        project: {
          organizationId,
        },
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        durationHours: true,
        billable: true,
        costAtTime: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
          },
        },
      },
    })

    const totalHours = timesheets.reduce((sum: number, t: any) => sum + Number(t.durationHours), 0)
    const billableHours = timesheets
      .filter((t: any) => t.billable)
      .reduce((sum: number, t: any) => sum + Number(t.durationHours), 0)
    const nonBillableHours = totalHours - billableHours

    const totalCost = timesheets.reduce((sum: number, t: any) => sum + Number(t.costAtTime), 0)

    // Calculate weighted average hourly rate
    const avgHourlyRate = totalHours > 0 ? totalCost / totalHours : 0

    // Estimated revenue (billable hours * avg rate * 1.5 markup)
    const estimatedRevenue = billableHours * avgHourlyRate * 1.5

    const billablePercentage = totalHours > 0 ? (billableHours / totalHours) * 100 : 0

    // Top 5 users by hours logged
    const userHoursMap = new Map<number, {
      userId: number
      userName: string
      hours: number
      billableHours: number
      cost: number
    }>()

    timesheets.forEach((t: any) => {
      const userId = t.userId
      const userName = t.user?.name || `User ${userId}`
      const hours = Number(t.durationHours)
      const cost = Number(t.costAtTime)
      const isBillable = t.billable

      if (!userHoursMap.has(userId)) {
        userHoursMap.set(userId, {
          userId,
          userName,
          hours: 0,
          billableHours: 0,
          cost: 0,
        })
      }

      const userData = userHoursMap.get(userId)!
      userData.hours += hours
      userData.cost += cost
      if (isBillable) {
        userData.billableHours += hours
      }
    })

    const topUsers = Array.from(userHoursMap.values())
      .sort((a: any, b: any) => b.hours - a.hours)
      .slice(0, 5)
      .map((u: any) => ({
        ...u,
        hours: Math.round(u.hours * 100) / 100,
        billableHours: Math.round(u.billableHours * 100) / 100,
        cost: Math.round(u.cost * 100) / 100,
      }))

    // Weekly trend (last 8 weeks)
    const weeklyMap = new Map<string, {
      week: string
      hours: number
      billableHours: number
      cost: number
    }>()

    timesheets.forEach((t: any) => {
      const date = new Date(t.createdAt)
      const week = this.getISOWeek(date)
      const hours = Number(t.durationHours)
      const cost = Number(t.costAtTime)

      if (!weeklyMap.has(week)) {
        weeklyMap.set(week, {
          week,
          hours: 0,
          billableHours: 0,
          cost: 0,
        })
      }

      const weekData = weeklyMap.get(week)!
      weekData.hours += hours
      weekData.cost += cost
      if (t.billable) {
        weekData.billableHours += hours
      }
    })

    const weeklyTrend = Array.from(weeklyMap.values())
      .sort((a: any, b: any) => a.week.localeCompare(b.week))
      .slice(-8) // Last 8 weeks
      .map((w: any) => ({
        ...w,
        hours: Math.round(w.hours * 100) / 100,
        billableHours: Math.round(w.billableHours * 100) / 100,
        cost: Math.round(w.cost * 100) / 100,
      }))

    return {
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
        nonBillableHours: Math.round(nonBillableHours * 100) / 100,
        avgHourlyRate: Math.round(avgHourlyRate * 100) / 100,
        billablePercentage: Math.round(billablePercentage * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
      },
      topUsers,
      weeklyTrend,
    }
  }

  /**
   * Get ISO week string (YYYY-Www)
   */
  private static getISOWeek(date: Date): string {
    const tempDate = new Date(date.valueOf())
    const dayNum = (date.getDay() + 6) % 7
    tempDate.setDate(tempDate.getDate() - dayNum + 3)
    const firstThursday = tempDate.valueOf()
    tempDate.setMonth(0, 1)
    if (tempDate.getDay() !== 4) {
      tempDate.setMonth(0, 1 + ((4 - tempDate.getDay()) + 7) % 7)
    }
    const weekNum = 1 + Math.ceil((firstThursday - tempDate.valueOf()) / 604800000)
    return `${tempDate.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
  }

  /**
   * Get user-specific productivity metrics
   */
  static async getUserProductivity(
    organizationId: number,
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalHours: number
    billableHours: number
    projectCount: number
    taskCount: number
    avgHoursPerDay: number
    utilizationRate: number
  }> {
    if (!endDate) {
      endDate = new Date()
    }
    if (!startDate) {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
    }

    const timesheets = await prisma.timesheet.findMany({
      where: {
        userId,
        project: {
          organizationId,
        },
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        durationHours: true,
        billable: true,
        projectId: true,
        taskId: true,
      },
    })

    const totalHours = timesheets.reduce((sum: number, t: any) => sum + Number(t.durationHours), 0)
    const billableHours = timesheets
      .filter((t: any) => t.billable)
      .reduce((sum: number, t: any) => sum + Number(t.durationHours), 0)

    const uniqueProjects = new Set(timesheets.map((t: any) => t.projectId))
    const uniqueTasks = new Set(timesheets.filter((t: any) => t.taskId).map((t: any) => t.taskId))

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const avgHoursPerDay = daysDiff > 0 ? totalHours / daysDiff : 0

    // Utilization rate: assuming 8 hour workday, 5 days/week
    const workingDays = Math.floor(daysDiff * 5 / 7)
    const availableHours = workingDays * 8
    const utilizationRate = availableHours > 0 ? (totalHours / availableHours) * 100 : 0

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      billableHours: Math.round(billableHours * 100) / 100,
      projectCount: uniqueProjects.size,
      taskCount: uniqueTasks.size,
      avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
    }
  }
}

export const timesheetAnalyticsService = TimesheetAnalyticsService
