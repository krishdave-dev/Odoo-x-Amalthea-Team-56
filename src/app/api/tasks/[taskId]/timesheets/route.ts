import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, createdResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'
import { withAuth } from '@/lib/middleware/auth'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * POST /api/tasks/:taskId/timesheets
 * Log hours worked on a task
 * 
 * Permissions:
 * - Members: Can log hours on tasks assigned to them
 * - Managers/Admins: Can log hours on any task
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { user, error } = await withAuth(req)
    if (error) return error

    const { taskId } = await params
    const parsedTaskId = idSchema.parse(taskId)

    const body = await req.json()
    const { hours, notes } = body

    // Validate hours
    if (!hours || isNaN(parseFloat(hours)) || parseFloat(hours) <= 0) {
      return errorResponse('Invalid hours. Must be a positive number', 400)
    }

    const hoursDecimal = parseFloat(hours)

    // Get the task with project info
    const task = await prisma.task.findUnique({
      where: { id: parsedTaskId },
      include: {
        project: {
          select: {
            id: true,
            organizationId: true,
            projectManagerId: true,
          },
        },
      },
    })

    if (!task) {
      return errorResponse('Task not found', 404)
    }

    // Check organization
    if (task.project.organizationId !== user!.organizationId) {
      return errorResponse('Unauthorized', 403)
    }

    // Permission check for members
    if (user!.role === 'member') {
      // Members can only log hours on tasks assigned to them
      if (task.assigneeId !== user!.id) {
        return errorResponse('You can only log hours on tasks assigned to you', 403)
      }
    }

    // Get user's hourly rate for cost calculation
    const userDetails = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { hourlyRate: true },
    })

    const hourlyRate = userDetails?.hourlyRate || new Decimal(0)
    const costAtTime = hourlyRate.mul(hoursDecimal)

    // Create the timesheet entry
    const now = new Date()
    const startTime = new Date(now.getTime() - hoursDecimal * 60 * 60 * 1000) // Subtract hours from now

    const timesheet = await prisma.timesheet.create({
      data: {
        projectId: task.projectId,
        taskId: parsedTaskId,
        userId: user!.id,
        start: startTime,
        end: now,
        durationHours: new Decimal(hoursDecimal),
        billable: true,
        notes: notes || null,
        costAtTime,
        status: 'draft',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Update task's hours logged
    await prisma.task.update({
      where: { id: parsedTaskId },
      data: {
        hoursLogged: {
          increment: hoursDecimal,
        },
      },
    })

    return createdResponse({
      message: 'Hours logged successfully',
      timesheet,
    })
  } catch (err) {
    return handleError(err)
  }
}

/**
 * GET /api/tasks/:taskId/timesheets
 * Get all timesheets for a task
 * 
 * Permissions:
 * - Members: Can only view their own timesheets for tasks assigned to them
 * - Managers/Admins: Can view all timesheets for tasks in their projects
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { user, error } = await withAuth(req)
    if (error) return error

    const { taskId } = await params
    const parsedTaskId = idSchema.parse(taskId)

    // Get the task with project info
    const task = await prisma.task.findUnique({
      where: { id: parsedTaskId },
      include: {
        project: {
          select: {
            organizationId: true,
            projectManagerId: true,
          },
        },
      },
    })

    if (!task) {
      return errorResponse('Task not found', 404)
    }

    // Check organization
    if (task.project.organizationId !== user!.organizationId) {
      return errorResponse('Unauthorized', 403)
    }

    // Build query based on role
    const whereClause: any = {
      taskId: parsedTaskId,
      deletedAt: null,
    }

    // Members can only see their own timesheets
    if (user!.role === 'member') {
      whereClause.userId = user!.id
    }

    const timesheets = await prisma.timesheet.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse(timesheets)
  } catch (err) {
    return handleError(err)
  }
}
