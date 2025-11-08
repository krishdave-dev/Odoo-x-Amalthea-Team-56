import { NextResponse } from 'next/server'
import { taskService } from '@/services/task.service'
import {
  successResponse,
  paginatedResponse,
  createdResponse,
} from '@/lib/response'
import { handleError, NotFoundError } from '@/lib/error'
import {
  createTaskSchema,
  parseBody,
  parseQuery,
  taskQuerySchema,
  idSchema,
} from '@/lib/validation'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/task-lists/:listId/tasks
 * Get all tasks in a task list
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params
    idSchema.parse(listId)

    // Verify task list exists
    const taskList = await prisma.taskList.findUnique({
      where: { id: listId },
    })

    if (!taskList) {
      throw new NotFoundError('Task list')
    }

    const { searchParams } = new URL(req.url)
    const query = parseQuery(searchParams, taskQuerySchema)

    const result = await taskService.getTasks(
      query.page,
      query.pageSize,
      {
        listId,
        assigneeId: query.assigneeId,
        status: query.status,
        priority: query.priority,
        search: query.q,
      }
    )

    return paginatedResponse(result)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/task-lists/:listId/tasks
 * Create a new task in a task list
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params
    idSchema.parse(listId)

    // Get task list and verify it exists
    const taskList = await prisma.taskList.findUnique({
      where: { id: listId },
      select: { projectId: true },
    })

    if (!taskList) {
      throw new NotFoundError('Task list')
    }

    const body = await parseBody(req, createTaskSchema)

    // Override with params
    const input = {
      ...body,
      listId,
      projectId: taskList.projectId,
    }

    const task = await taskService.createTask(input)

    return createdResponse(task)
  } catch (error) {
    return handleError(error)
  }
}
