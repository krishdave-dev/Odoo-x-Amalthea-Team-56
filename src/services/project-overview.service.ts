/**
 * ProjectOverviewService - Compute aggregate project metrics
 * 
 * This service provides summary metrics for the Project Dashboard:
 * - Task completion stats
 * - Hours logged (billable/non-billable)
 * - Financial metrics (revenue, cost, profit)
 * - Budget utilization
 * - Progress percentage
 * 
 * Features:
 * - Efficient Prisma aggregations
 * - Cache-friendly design
 * - Multi-tenant security
 */

import { prisma } from '@/lib/prisma'
import { CacheService, type CacheType } from '@/services/cache.service'

export interface ProjectOverview {
  projectId: number
  overview: {
    // Task metrics
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    notStartedTasks: number
    taskCompletionRate: number // percentage

    // Time metrics
    hoursLogged: number
    billableHours: number
    nonBillableHours: number
    approvedHours: number
    pendingHours: number

    // Financial metrics
    expenses: number
    revenue: number
    cost: number // expenses + bills
    profit: number // revenue - cost
    profitMargin: number // (profit / revenue) * 100

    // Budget metrics
    budget: number | null
    budgetUtilization: number // (cost / budget) * 100
    budgetRemaining: number

    // Progress metrics
    progressPct: number
    estimatedHours: number
    hoursVariance: number // estimated - logged

    // Member metrics
    totalMembers: number
    activeMembers: number

    // Document metrics
    totalInvoices: number
    paidInvoices: number
    totalBills: number
    paidBills: number
    totalSalesOrders: number
    totalPurchaseOrders: number
    totalAttachments: number
  }
  computedAt: Date
  cached: boolean
}

export class ProjectOverviewService {
  /**
   * Get comprehensive project overview with caching
   */
  static async getOverview(
    projectId: number,
    organizationId: number,
    options: { forceRefresh?: boolean } = {}
  ): Promise<ProjectOverview> {
    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
        deletedAt: null,
      },
    })

    if (!project) {
      throw new Error('Project not found or access denied')
    }

    // Use cache-aside pattern
    const cacheKey: CacheType = 'project_summary'
    const cacheOptions = {
      forceRefresh: options.forceRefresh,
      memoryTTL: 5 * 60 * 1000, // 5 minutes
      dbTTL: 10 * 60 * 1000, // 10 minutes
    }

    const result = await CacheService.getOrCompute(
      organizationId,
      cacheKey,
      async () => {
        return await this.computeOverview(projectId, organizationId)
      },
      cacheOptions
    )

    return {
      projectId,
      overview: result.data,
      computedAt: new Date(),
      cached: result.cached,
    }
  }

  /**
   * Compute all overview metrics (called when cache misses)
   */
  private static async computeOverview(
    projectId: number,
    organizationId: number
  ) {
    const [
      // Task metrics
      taskStats,
      
      // Timesheet metrics
      timesheetStats,
      billableTimesheetStats,
      approvedTimesheetStats,
      
      // Financial metrics
      expenseStats,
      invoiceStats,
      billStats,
      
      // Document metrics
      invoiceCounts,
      billCounts,
      salesOrderCount,
      purchaseOrderCount,
      attachmentCount,
      
      // Project data
      project,
      
      // Member metrics
      memberCount,
      
      // Task estimates
      taskEstimates,
    ] = await Promise.all([
      // Task statistics by status
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId, deletedAt: null },
        _count: { id: true },
      }),

      // Total timesheets
      prisma.timesheet.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { durationHours: true },
      }),

      // Billable timesheets
      prisma.timesheet.aggregate({
        where: { projectId, deletedAt: null, billable: true },
        _sum: { durationHours: true },
      }),

      // Approved timesheets
      prisma.timesheet.aggregate({
        where: { projectId, deletedAt: null, status: 'approved' },
        _sum: { durationHours: true },
      }),

      // Expenses
      prisma.expense.aggregate({
        where: { projectId, deletedAt: null, status: { notIn: ['draft', 'rejected'] } },
        _sum: { amount: true },
      }),

      // Customer Invoices (exclude drafts for revenue)
      prisma.customerInvoice.aggregate({
        where: { projectId, deletedAt: null, status: { notIn: ['draft', 'cancelled'] } },
        _sum: { amount: true },
      }),

      // Vendor Bills
      prisma.vendorBill.aggregate({
        where: { projectId, deletedAt: null, status: { notIn: ['draft', 'cancelled'] } },
        _sum: { amount: true },
      }),

      // Invoice counts by status
      prisma.customerInvoice.groupBy({
        by: ['status'],
        where: { projectId, deletedAt: null },
        _count: { id: true },
      }),

      // Bill counts by status
      prisma.vendorBill.groupBy({
        by: ['status'],
        where: { projectId, deletedAt: null },
        _count: { id: true },
      }),

      // Sales Orders count
      prisma.salesOrder.count({
        where: { projectId, deletedAt: null },
      }),

      // Purchase Orders count
      prisma.purchaseOrder.count({
        where: { projectId, deletedAt: null },
      }),

      // Attachments count
      prisma.attachment.count({
        where: { ownerId: projectId, ownerType: 'project', organizationId },
      }),

      // Project details
      prisma.project.findUnique({
        where: { id: projectId },
        select: {
          budget: true,
          progressPct: true,
          cachedHoursLogged: true,
          cachedCost: true,
          cachedRevenue: true,
          cachedProfit: true,
        },
      }),

      // Member count
      prisma.projectMember.count({
        where: { projectId },
      }),

      // Task estimates
      prisma.task.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { estimateHours: true, hoursLogged: true },
      }),
    ])

    // Calculate task metrics
    const totalTasks = taskStats.reduce((sum: number, stat: any) => sum + stat._count.id, 0)
    const completedTasks = taskStats.find((s: any) => s.status === 'done')?._count.id || 0
    const inProgressTasks = taskStats.find((s: any) => s.status === 'in_progress')?._count.id || 0
    const notStartedTasks = taskStats.find((s: any) => s.status === 'new')?._count.id || 0
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Calculate time metrics
    const hoursLogged = Number(timesheetStats._sum.durationHours ?? 0)
    const billableHours = Number(billableTimesheetStats._sum.durationHours ?? 0)
    const nonBillableHours = hoursLogged - billableHours
    const approvedHours = Number(approvedTimesheetStats._sum.durationHours ?? 0)
    const pendingHours = hoursLogged - approvedHours

    // Calculate financial metrics
    const expenses = Number(expenseStats._sum.amount ?? 0)
    const revenue = Number(invoiceStats._sum.amount ?? 0)
    const billsTotal = Number(billStats._sum.amount ?? 0)
    const cost = expenses + billsTotal
    const profit = revenue - cost
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

    // Calculate budget metrics
    const budget = project?.budget ? Number(project.budget) : null
    const budgetUtilization = budget && budget > 0 ? (cost / budget) * 100 : 0
    const budgetRemaining = budget ? budget - cost : 0

    // Calculate progress metrics
    const progressPct = Number(project?.progressPct ?? 0)
    const estimatedHours = Number(taskEstimates._sum.estimateHours ?? 0)
    const hoursVariance = estimatedHours - hoursLogged

    // Calculate document metrics
    const totalInvoices = invoiceCounts.reduce((sum: number, stat: any) => sum + stat._count.id, 0)
    const paidInvoices = invoiceCounts.find((s: any) => s.status === 'paid')?._count.id || 0
    const totalBills = billCounts.reduce((sum: number, stat: any) => sum + stat._count.id, 0)
    const paidBills = billCounts.find((s: any) => s.status === 'paid')?._count.id || 0

    return {
      // Task metrics
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,

      // Time metrics
      hoursLogged: Math.round(hoursLogged * 100) / 100,
      billableHours: Math.round(billableHours * 100) / 100,
      nonBillableHours: Math.round(nonBillableHours * 100) / 100,
      approvedHours: Math.round(approvedHours * 100) / 100,
      pendingHours: Math.round(pendingHours * 100) / 100,

      // Financial metrics
      expenses: Math.round(expenses * 100) / 100,
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,

      // Budget metrics
      budget,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      budgetRemaining: budget ? Math.round(budgetRemaining * 100) / 100 : 0,

      // Progress metrics
      progressPct: Math.round(progressPct * 100) / 100,
      estimatedHours: Math.round(estimatedHours * 100) / 100,
      hoursVariance: Math.round(hoursVariance * 100) / 100,

      // Member metrics
      totalMembers: memberCount,
      activeMembers: memberCount, // TODO: filter by active users

      // Document metrics
      totalInvoices,
      paidInvoices,
      totalBills,
      paidBills,
      totalSalesOrders: salesOrderCount,
      totalPurchaseOrders: purchaseOrderCount,
      totalAttachments: attachmentCount,
    }
  }

  /**
   * Invalidate cache for a project
   * Call this when any related entity changes
   */
  static async invalidateCache(organizationId: number): Promise<void> {
    await CacheService.invalidate(organizationId, 'project_summary')
  }

  /**
   * Get lightweight project health score (0-100)
   * Based on budget, schedule, and completion metrics
   */
  static async getProjectHealth(
    projectId: number,
    organizationId: number
  ): Promise<{
    healthScore: number
    indicators: {
      budgetHealth: number // 0-100
      scheduleHealth: number // 0-100
      completionHealth: number // 0-100
    }
    alerts: string[]
  }> {
    const { overview } = await this.getOverview(projectId, organizationId)
    const alerts: string[] = []

    // Budget health (100 = well under budget, 0 = over budget)
    let budgetHealth = 100
    if (overview.budget && overview.budget > 0) {
      if (overview.budgetUtilization <= 80) {
        budgetHealth = 100
      } else if (overview.budgetUtilization <= 100) {
        budgetHealth = 100 - ((overview.budgetUtilization - 80) * 5)
      } else {
        budgetHealth = 0
        alerts.push(`Over budget by ${(overview.budgetUtilization - 100).toFixed(1)}%`)
      }
    }

    // Completion health (based on task completion rate)
    const completionHealth = overview.taskCompletionRate

    // Schedule health (simplified - based on progress vs completion)
    let scheduleHealth = 100
    if (overview.progressPct < overview.taskCompletionRate - 20) {
      scheduleHealth = 60
      alerts.push('Progress is behind task completion')
    }

    // Overall health score (weighted average)
    const healthScore = Math.round(
      (budgetHealth * 0.4 + scheduleHealth * 0.3 + completionHealth * 0.3)
    )

    // Additional alerts
    if (overview.budgetUtilization > 90 && overview.budgetUtilization < 100) {
      alerts.push('Budget utilization above 90%')
    }
    if (overview.hoursVariance < -10) {
      alerts.push(`Over estimated hours by ${Math.abs(overview.hoursVariance).toFixed(1)}h`)
    }

    return {
      healthScore,
      indicators: {
        budgetHealth: Math.round(budgetHealth),
        scheduleHealth: Math.round(scheduleHealth),
        completionHealth: Math.round(completionHealth),
      },
      alerts,
    }
  }
}

export const projectOverviewService = ProjectOverviewService
