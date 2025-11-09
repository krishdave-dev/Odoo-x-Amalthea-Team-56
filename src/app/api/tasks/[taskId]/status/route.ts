import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'
import { withAuth } from '@/lib/middleware/auth'

/**
 * PATCH /api/tasks/:taskId/status
 * Update task status (for members: new → in_progress → completed)
 * 
 * Permissions:
 * - Members: Can only update status of tasks assigned to them
 * - Managers/Admins: Can update any task status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { user, error } = await withAuth(req)
    if (error) return error

    const { taskId } = await params
    const parsedTaskId = idSchema.parse(taskId)

    const body = await req.json()
    const { status } = body

    // Validate status value
    const validStatuses = ['new', 'in_progress', 'completed']
    if (!status || !validStatuses.includes(status)) {
      return errorResponse('Invalid status. Must be: new, in_progress, or completed', 400)
    }

    // Get the task
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

    // Permission check for members
    if (user!.role === 'member') {
      // Members can only update tasks assigned to them
      if (task.assigneeId !== user!.id) {
        return errorResponse('You can only update status of tasks assigned to you', 403)
      }

      // Members can only progress forward: new → in_progress → completed
      const currentStatus = task.status
      if (
        (currentStatus === 'new' && status === 'completed') ||
        (currentStatus === 'completed' && status !== 'completed') ||
        (currentStatus === 'in_progress' && status === 'new')
      ) {
        return errorResponse(
          'Invalid status transition. Members can only move tasks forward: new → in_progress → completed',
          400
        )
      }
    }

    // Update the task status
    const updatedTask = await prisma.task.update({
      where: { id: parsedTaskId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return successResponse({
      message: 'Task status updated successfully',
      task: updatedTask,
    })
  } catch (err) {
    return handleError(err)
  }
}
