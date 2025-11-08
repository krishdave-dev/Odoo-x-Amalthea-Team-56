/**
 * ProjectAnalyticsService - Project Performance Metrics
 * 
 * Computes:
 * - Total projects by status
 * - Budget, cost, revenue, profit aggregations
 * - Average progress and profit margins
 * - Project health indicators
 */

import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface ProjectSummary {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  plannedProjects: number
  avgProgressPct: number
  totalBudget: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  avgProfitMargin: number
}

export interface ProjectByStatus {
  planned: number
  active: number
  completed: number
  onHold?: number
  cancelled?: number
}

export interface ProjectHealthMetrics {
  healthyProjects: number // profit margin > 15%
  atRiskProjects: number // profit margin 0-15%
  unprofitableProjects: number // profit margin < 0
  overBudgetProjects: number // cost > budget
}

export interface TopProject {
  id: number
  name: string
  revenue: number
  profit: number
  profitMargin: number
  progressPct: number
  status: string
}

export interface ProjectAnalyticsResponse {
  summary: ProjectSummary
  byStatus: ProjectByStatus
  health: ProjectHealthMetrics
  topProjects: TopProject[]
}

export class ProjectAnalyticsService {
  /**
   * Get comprehensive project analytics for an organization
   */
  static async getAnalytics(organizationId: number): Promise<ProjectAnalyticsResponse> {
    // Fetch all active projects (not soft-deleted)
    const projects = await prisma.project.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        status: true,
        budget: true,
        cachedCost: true,
        cachedRevenue: true,
        cachedProfit: true,
        progressPct: true,
      },
    })

    const totalProjects = projects.length

    // Count by status
    const byStatus: ProjectByStatus = {
      planned: projects.filter(p => p.status === 'planned').length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      onHold: projects.filter(p => p.status === 'on_hold').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length,
    }

    // Aggregate financial data
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0)
    const totalCost = projects.reduce((sum, p) => sum + Number(p.cachedCost), 0)
    const totalRevenue = projects.reduce((sum, p) => sum + Number(p.cachedRevenue), 0)
    const totalProfit = projects.reduce((sum, p) => sum + Number(p.cachedProfit), 0)

    // Calculate averages
    const avgProgressPct = totalProjects > 0
      ? projects.reduce((sum, p) => sum + Number(p.progressPct), 0) / totalProjects
      : 0

    const avgProfitMargin = totalRevenue > 0
      ? (totalProfit / totalRevenue) * 100
      : 0

    // Health metrics
    let healthyProjects = 0
    let atRiskProjects = 0
    let unprofitableProjects = 0
    let overBudgetProjects = 0

    projects.forEach(p => {
      const revenue = Number(p.cachedRevenue)
      const profit = Number(p.cachedProfit)
      const cost = Number(p.cachedCost)
      const budget = Number(p.budget || 0)

      const margin = revenue > 0 ? (profit / revenue) * 100 : 0

      if (margin > 15) healthyProjects++
      else if (margin >= 0) atRiskProjects++
      else unprofitableProjects++

      if (budget > 0 && cost > budget) overBudgetProjects++
    })

    // Top 5 projects by profit
    const topProjects: TopProject[] = projects
      .map(p => ({
        id: p.id,
        name: p.name,
        revenue: Number(p.cachedRevenue),
        profit: Number(p.cachedProfit),
        profitMargin: Number(p.cachedRevenue) > 0
          ? (Number(p.cachedProfit) / Number(p.cachedRevenue)) * 100
          : 0,
        progressPct: Number(p.progressPct),
        status: p.status,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)

    return {
      summary: {
        totalProjects,
        activeProjects: byStatus.active,
        completedProjects: byStatus.completed,
        plannedProjects: byStatus.planned,
        avgProgressPct: Math.round(avgProgressPct * 100) / 100,
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        avgProfitMargin: Math.round(avgProfitMargin * 100) / 100,
      },
      byStatus,
      health: {
        healthyProjects,
        atRiskProjects,
        unprofitableProjects,
        overBudgetProjects,
      },
      topProjects,
    }
  }

  /**
   * Get project performance trend over time (last 6 months)
   */
  static async getProjectTrend(organizationId: number): Promise<{
    trend: Array<{
      month: string
      projectsCreated: number
      projectsCompleted: number
      totalRevenue: number
      totalCost: number
    }>
  }> {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const projects = await prisma.project.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
        updatedAt: true,
        status: true,
        cachedRevenue: true,
        cachedCost: true,
      },
    })

    // Group by month
    const monthlyData = new Map<string, {
      projectsCreated: number
      projectsCompleted: number
      totalRevenue: number
      totalCost: number
    }>()

    projects.forEach(p => {
      const month = p.createdAt.toISOString().substring(0, 7) // YYYY-MM
      
      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          projectsCreated: 0,
          projectsCompleted: 0,
          totalRevenue: 0,
          totalCost: 0,
        })
      }

      const data = monthlyData.get(month)!
      data.projectsCreated++
      data.totalRevenue += Number(p.cachedRevenue)
      data.totalCost += Number(p.cachedCost)

      if (p.status === 'completed') {
        data.projectsCompleted++
      }
    })

    const trend = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        ...data,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
        totalCost: Math.round(data.totalCost * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return { trend }
  }
}

export const projectAnalyticsService = ProjectAnalyticsService
