import { NextResponse } from 'next/server'
import { projectService } from '@/services/project.service'
import {
  successResponse,
  notFoundResponse,
  noContentResponse,
  errorResponse,
} from '@/lib/response'
import { handleError } from '@/lib/error'
import { updateProjectSchema, parseBody, uuidSchema } from '@/lib/validation'

/**
 * GET /api/projects/:projectId
 * Get a single project by ID with members and task lists
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    uuidSchema.parse(projectId)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const project = await projectService.getProjectById(projectId, organizationId)

    if (!project) {
      return notFoundResponse('Project')
    }

    return successResponse(project)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/projects/:projectId
 * Update a project with optimistic locking
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    uuidSchema.parse(projectId)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const body = await parseBody(req, updateProjectSchema)

    const version = body.version || 1
    const result = await projectService.updateProject(
      projectId,
      organizationId,
      version,
      body
    )

    if (!result.success) {
      return errorResponse(result.error || 'Update failed', 409)
    }

    return successResponse(result.project)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/projects/:projectId
 * Soft delete a project
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    uuidSchema.parse(projectId)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const success = await projectService.deleteProject(projectId, organizationId)

    if (!success) {
      return errorResponse('Failed to delete project', 500)
    }

    return noContentResponse()
  } catch (error) {
    return handleError(error)
  }
}
