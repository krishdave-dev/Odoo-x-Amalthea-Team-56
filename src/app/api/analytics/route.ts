import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { withAuth } from '@/lib/middleware/auth'

/**
 * GET /api/analytics
 * Get analytics dashboard data for the organization
 * Query params: organizationId
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const organizationId = Number(searchParams.get('organizationId'))

    if (!organizationId || isNaN(organizationId)) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    // Verify user belongs to this organization
    if (user!.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Fetch analytics data
    const [projects, tasks, timesheets] = await Promise.all([
      prisma.project.findMany({
        where: { organizationId, deletedAt: null },
        include: {
          tasks: {
            where: { deletedAt: null },
            select: { id: true, status: true },
          },
          _count: {
            select: { tasks: true },
          },
        },
      }),
      prisma.task.findMany({
        where: {
          project: { organizationId, deletedAt: null },
          deletedAt: null,
        },
        include: {
          assignee: { select: { id: true, name: true } },
        },
      }),
      prisma.timesheet.findMany({
        where: {
          task: {
            project: { organizationId, deletedAt: null },
          },
          deletedAt: null,
        },
        include: {
          task: { select: { id: true, title: true } },
          user: { select: { id: true, name: true } },
        },
      }),
    ])

    // Calculate KPIs
    const totalProjects = projects.length
    const tasksCompleted = tasks.filter((t) => t.status === 'completed').length
    const totalHoursLogged = timesheets.reduce((sum, ts) => sum + Number(ts.durationHours || 0), 0)

    // Calculate billable vs non-billable hours
    const billableTimesheets = timesheets.filter((ts) => ts.billable)
    const billableHours = Math.round(
      billableTimesheets.reduce((sum, ts) => sum + Number(ts.durationHours || 0), 0)
    )
    const nonBillableHours = Math.round(totalHoursLogged - billableHours)

    // Project Progress % - calculate based on completed tasks / total tasks
    const projectProgress = projects.map((project) => {
      const completedCount = project.tasks.filter((t) => t.status === 'completed').length
      const totalCount = project._count.tasks || 1
      const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      return { name: project.name, progress }
    })

    // Resource Utilization - hours by team member
    const resourceMap = new Map<number, { name: string; hours: number }>()
    timesheets.forEach((ts) => {
      if (ts.user?.id) {
        const existing = resourceMap.get(ts.user.id) || { name: ts.user.name || 'Unknown', hours: 0 }
        existing.hours += Number(ts.durationHours || 0)
        resourceMap.set(ts.user.id, existing)
      }
    })

    const resourceUtilization = Array.from(resourceMap.values()).map((resource) => ({
      name: resource.name,
      utilized: Math.round(resource.hours),
      available: 160, // Standard monthly hours
    }))

    // Cost vs Revenue by project
    // Using project cached cost and budget as revenue
    const costVsRevenue = projects.map((project) => ({
      project: project.name,
      cost: Math.round(Number(project.cachedCost || 0)),
      revenue: Math.round(Number(project.budget || 0)),
    }))

    const data = {
      totalProjects,
      tasksCompleted,
      totalHoursLogged: Math.round(totalHoursLogged),
      billableHours,
      nonBillableHours,
      projectProgress: projectProgress.slice(0, 10), // Top 10 projects
      resourceUtilization: resourceUtilization.slice(0, 10), // Top 10 resources
      costVsRevenue: costVsRevenue.slice(0, 10), // Top 10 projects
    }

    return successResponse(data)
  } catch (error) {
    return handleError(error)
  }
}
