import { NextResponse } from 'next/server'
import { taskService } from '@/services/task.service'
import {
  successResponse,
  notFoundResponse,
  noContentResponse,
  errorResponse,
} from '@/lib/response'
import { handleError } from '@/lib/error'
import { updateTaskSchema, parseBody, idSchema } from '@/lib/validation'

/**
 * GET /api/tasks/:taskId
 * Get a single task by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    idSchema.parse(taskId)

    const task = await taskService.getTaskById(taskId)

    if (!task) {
      return notFoundResponse('Task')
    }

    return successResponse(task)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/tasks/:taskId
 * Update a task with optimistic locking and state validation
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    idSchema.parse(taskId)

    const body = await parseBody(req, updateTaskSchema)

    const version = body.version || 1
    const result = await taskService.updateTask(taskId, version, body)

    if (!result.success) {
      return errorResponse(result.error || 'Update failed', 409)
    }

    return successResponse(result.task)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/tasks/:taskId
 * Soft delete a task
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    idSchema.parse(taskId)

    const success = await taskService.deleteTask(taskId)

    if (!success) {
      return errorResponse('Failed to delete task', 500)
    }

    return noContentResponse()
  } catch (error) {
    return handleError(error)
  }
}
