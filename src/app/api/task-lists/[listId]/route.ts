import { NextResponse } from 'next/server'
import { taskListService } from '@/services/taskList.service'
import {
  successResponse,
  notFoundResponse,
  noContentResponse,
} from '@/lib/response'
import { handleError } from '@/lib/error'
import { updateTaskListSchema, parseBody, idSchema } from '@/lib/validation'

/**
 * GET /api/task-lists/:listId
 * Get a single task list by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params
    idSchema.parse(listId)

    const taskList = await taskListService.getTaskListById(listId)

    if (!taskList) {
      return notFoundResponse('Task list')
    }

    return successResponse(taskList)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/task-lists/:listId
 * Update a task list
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params
    idSchema.parse(listId)

    const body = await parseBody(req, updateTaskListSchema)

    const taskList = await taskListService.updateTaskList(listId, body)

    if (!taskList) {
      return notFoundResponse('Task list')
    }

    return successResponse(taskList)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/task-lists/:listId
 * Delete a task list and soft delete all its tasks
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params
    idSchema.parse(listId)

    const success = await taskListService.deleteTaskList(listId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete task list' },
        { status: 500 }
      )
    }

    return noContentResponse()
  } catch (error) {
    return handleError(error)
  }
}
