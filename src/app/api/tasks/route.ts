import { NextRequest, NextResponse } from 'next/server'
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
import { withAuth, checkProjectAccess } from '@/lib/middleware/auth'

/**
 * GET /api/tasks
 * Get all tasks with pagination and filters
 * Query params: page, pageSize, projectId, listId, assigneeId, status, priority, q
 * 
 * Permissions: 
 * - Admin/Manager/Finance: All tasks in their org
 * - Member: Only tasks assigned to them
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const query = parseQuery(searchParams, taskQuerySchema)

    // Members can only see their own tasks
    const filters: any = {
      projectId: query.projectId,
      assigneeId: query.assigneeId,
      status: query.status,
      priority: query.priority,
      search: query.q,
    }

    // If member, force filter to their tasks only
    if (user!.role === 'member') {
      filters.assigneeId = user!.id
    }

    // Filter by organization
    filters.organizationId = user!.organizationId

    const result = await taskService.getTasks(
      query.page,
      query.pageSize,
      filters
    )
    

    return paginatedResponse(result)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/tasks
 * Create a new task
 * 
 * Permissions: Admin or Manager only
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req, { 
      requirePermissions: ['canCreateTasks'] 
    })
    if (error) return error

    const body = await parseBody(req, createTaskSchema)

    // Verify project exists and user has access
    const projectError = await checkProjectAccess(user!, body.projectId, prisma)
    if (projectError) return projectError

    const task = await taskService.createTask(body)

    return createdResponse(task)
  } catch (error) {
    return handleError(error)
  }
}

