/**
 * ExpenseAnalyticsService - Expense & Cost Tracking Metrics
 * 
 * Computes:
 * - Total expenses by status
 * - Billable vs non-billable breakdown
 * - Pending approvals
 * - Spend by project
 * - Category analysis
 */

import { prisma } from '@/lib/prisma'

export interface ExpenseSummary {
  totalExpenses: number
  billable: number
  nonBillable: number
  pendingApproval: number
  approved: number
  rejected: number
  paid: number
  avgExpenseAmount: number
}

export interface ExpenseByStatus {
  draft: number
  submitted: number
  approved: number
  rejected: number
  paid: number
}

export interface ProjectExpense {
  projectId: number
  projectName: string
  amount: number
  expenseCount: number
  billableAmount: number
  nonBillableAmount: number
}

export interface ExpenseAnalyticsResponse {
  summary: ExpenseSummary
  byStatus: ExpenseByStatus
  byProject: ProjectExpense[]
  monthlyTrend: Array<{
    month: string
    amount: number
    count: number
  }>
}

export class ExpenseAnalyticsService {
  /**
   * Get expense analytics for an organization
   */
  static async getAnalytics(
    organizationId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<ExpenseAnalyticsResponse> {
    // Default to last 90 days if no dates provided
    if (!endDate) {
      endDate = new Date()
    }
    if (!startDate) {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 90)
    }

    // Fetch expenses with project info
    const expenses = await prisma.expense.findMany({
      where: {
        organizationId,
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        amount: true,
        billable: true,
        status: true,
        projectId: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
    const billable = expenses
      .filter((e: any) => e.billable)
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0)
    const nonBillable = totalExpenses - billable

    // Count by status
    const byStatus: ExpenseByStatus = {
      draft: expenses.filter((e: any) => e.status === 'draft').length,
      submitted: expenses.filter((e: any) => e.status === 'submitted').length,
      approved: expenses.filter((e: any) => e.status === 'approved').length,
      rejected: expenses.filter((e: any) => e.status === 'rejected').length,
      paid: expenses.filter((e: any) => e.status === 'paid').length,
    }

    const pendingApproval = byStatus.submitted
    const approved = byStatus.approved + byStatus.paid
    const rejected = byStatus.rejected

    const paidAmount = expenses
      .filter((e: any) => e.status === 'paid')
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0)

    const avgExpenseAmount = expenses.length > 0 ? totalExpenses / expenses.length : 0

    // Group by project
    const projectMap = new Map<number, {
      projectId: number
      projectName: string
      amount: number
      expenseCount: number
      billableAmount: number
      nonBillableAmount: number
    }>()

    expenses.forEach((e: any) => {
      const projectId = e.projectId || 0
      const projectName = e.project?.name || 'No Project'
      const amount = Number(e.amount)

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          projectId,
          projectName,
          amount: 0,
          expenseCount: 0,
          billableAmount: 0,
          nonBillableAmount: 0,
        })
      }

      const projectData = projectMap.get(projectId)!
      projectData.amount += amount
      projectData.expenseCount++
      
      if (e.billable) {
        projectData.billableAmount += amount
      } else {
        projectData.nonBillableAmount += amount
      }
    })

    const byProject = Array.from(projectMap.values())
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 10) // Top 10 projects
      .map((p: any) => ({
        ...p,
        amount: Math.round(p.amount * 100) / 100,
        billableAmount: Math.round(p.billableAmount * 100) / 100,
        nonBillableAmount: Math.round(p.nonBillableAmount * 100) / 100,
      }))

    // Monthly trend (last 6 months)
    const monthlyMap = new Map<string, {
      month: string
      amount: number
      count: number
    }>()

    expenses.forEach((e: any) => {
      const month = new Date(e.createdAt).toISOString().substring(0, 7) // YYYY-MM
      const amount = Number(e.amount)

      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          month,
          amount: 0,
          count: 0,
        })
      }

      const monthData = monthlyMap.get(month)!
      monthData.amount += amount
      monthData.count++
    })

    const monthlyTrend = Array.from(monthlyMap.values())
      .sort((a: any, b: any) => a.month.localeCompare(b.month))
      .map((m: any) => ({
        ...m,
        amount: Math.round(m.amount * 100) / 100,
      }))

    return {
      summary: {
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        billable: Math.round(billable * 100) / 100,
        nonBillable: Math.round(nonBillable * 100) / 100,
        pendingApproval,
        approved,
        rejected,
        paid: Math.round(paidAmount * 100) / 100,
        avgExpenseAmount: Math.round(avgExpenseAmount * 100) / 100,
      },
      byStatus,
      byProject,
      monthlyTrend,
    }
  }

  /**
   * Get expense approval metrics
   */
  static async getApprovalMetrics(organizationId: number): Promise<{
    pendingCount: number
    avgApprovalTimeHours: number
    approvalRate: number
    rejectionRate: number
  }> {
    const expenses = await prisma.expense.findMany({
      where: {
        organizationId,
        deletedAt: null,
        submittedAt: {
          not: null,
        },
      },
      select: {
        status: true,
        submittedAt: true,
        approvedAt: true,
      },
    })

    const pendingCount = expenses.filter((e: any) => e.status === 'submitted').length
    const totalSubmitted = expenses.length

    const approved = expenses.filter((e: any) => e.status === 'approved' || e.status === 'paid').length
    const rejected = expenses.filter((e: any) => e.status === 'rejected').length

    const approvalRate = totalSubmitted > 0 ? (approved / totalSubmitted) * 100 : 0
    const rejectionRate = totalSubmitted > 0 ? (rejected / totalSubmitted) * 100 : 0

    // Calculate average approval time
    const approvedExpenses = expenses.filter((e: any) => e.approvedAt && e.submittedAt)
    let totalApprovalTimeMs = 0

    approvedExpenses.forEach((e: any) => {
      const submittedAt = new Date(e.submittedAt).getTime()
      const approvedAt = new Date(e.approvedAt).getTime()
      totalApprovalTimeMs += approvedAt - submittedAt
    })

    const avgApprovalTimeHours = approvedExpenses.length > 0
      ? totalApprovalTimeMs / approvedExpenses.length / (1000 * 60 * 60)
      : 0

    return {
      pendingCount,
      avgApprovalTimeHours: Math.round(avgApprovalTimeHours * 100) / 100,
      approvalRate: Math.round(approvalRate * 100) / 100,
      rejectionRate: Math.round(rejectionRate * 100) / 100,
    }
  }
}

export const expenseAnalyticsService = ExpenseAnalyticsService
