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
  uuidSchema,
} from '@/lib/validation'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tasks
 * Get all tasks with pagination and filters
 * Query params: page, pageSize, projectId, listId, assigneeId, status, priority, q
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = parseQuery(searchParams, taskQuerySchema)

    const result = await taskService.getTasks(
      query.page,
      query.pageSize,
      {
        projectId: query.projectId,
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
 * POST /api/tasks
 * Create a new task
 */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, createTaskSchema)

    const task = await taskService.createTask(body)

    return createdResponse(task)
  } catch (error) {
    return handleError(error)
  }
}
