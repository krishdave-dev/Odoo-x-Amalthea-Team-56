import { NextResponse } from 'next/server'
import { taskListService } from '@/services/taskList.service'
import {
  successResponse,
  createdResponse,
  notFoundResponse,
} from '@/lib/response'
import { handleError, NotFoundError } from '@/lib/error'
import { createTaskListSchema, parseBody, idSchema } from '@/lib/validation'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/projects/:projectId/task-lists
 * Get all task lists for a project
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    idSchema.parse(projectId)

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
    })

    if (!project) {
      throw new NotFoundError('Project')
    }

    const taskLists = await taskListService.getTaskLists(projectId)

    return successResponse(taskLists)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/projects/:projectId/task-lists
 * Create a new task list
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    idSchema.parse(projectId)

    const body = await parseBody(req, createTaskListSchema)

    // Ensure projectId from params matches body
    const input = {
      ...body,
      projectId,
    }

    const taskList = await taskListService.createTaskList(input)

    return createdResponse(taskList)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/projects/:projectId/task-lists/reorder
 * Reorder task lists
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    idSchema.parse(projectId)

    const body = await req.json()
    const orderedListIds = body.orderedListIds as string[]

    if (!Array.isArray(orderedListIds)) {
      return NextResponse.json(
        { success: false, error: 'orderedListIds must be an array' },
        { status: 400 }
      )
    }

    const success = await taskListService.reorderTaskLists(
      projectId,
      orderedListIds
    )

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to reorder task lists' },
        { status: 500 }
      )
    }

    return successResponse({ message: 'Task lists reordered successfully' })
  } catch (error) {
    return handleError(error)
  }
}
