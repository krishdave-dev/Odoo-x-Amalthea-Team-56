import { NextResponse } from 'next/server'
import { projectService } from '@/services/project.service'
import { getCurrentUser } from '@/lib/session'
import { canModifyProject } from '@/lib/permissions'
import {
  successResponse,
  notFoundResponse,
  noContentResponse,
  errorResponse,
} from '@/lib/response'
import { handleError } from '@/lib/error'
import { updateProjectSchema, parseBody, idSchema } from '@/lib/validation'

/**
 * GET /api/projects/:projectId
 * Get a single project by ID with members and task lists
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    const { projectId } = await params
    idSchema.parse(projectId)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    // Check organization access
    if (parseInt(organizationId) !== user.organizationId) {
      return errorResponse('Access denied to this organization', 403)
    }

    const project = await projectService.getProjectById(projectId, organizationId)

    if (!project) {
      return notFoundResponse('Project')
    }

    // TODO: Check if user has access to this specific project (for members)
    // For now, if they can list projects, they can view details

    return successResponse(project)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/projects/:projectId
 * Update a project with optimistic locking
 * Requires: canManageProjects (admin/manager) and project ownership
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    const { projectId } = await params
    idSchema.parse(projectId)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    // Check organization access
    if (parseInt(organizationId) !== user.organizationId) {
      return errorResponse('Access denied to this organization', 403)
    }

    // Get project to check ownership
    const project = await projectService.getProjectById(projectId, organizationId)
    if (!project) {
      return notFoundResponse('Project')
    }

    // Check permission to modify
    if (!canModifyProject(user.role, user.id, project.projectManagerId)) {
      return errorResponse('Insufficient permissions to modify this project', 403)
    }

    const body = await parseBody(req, updateProjectSchema)

    const version = body.version || 1
    const result = await projectService.updateProject(
      projectId,
      organizationId,
      version,
      {
        ...body,
        projectManagerId: body.projectManagerId?.toString() || undefined,
      }
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
 * Requires: canManageProjects (admin/manager) and project ownership
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    const { projectId } = await params
    idSchema.parse(projectId)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    // Check organization access
    if (parseInt(organizationId) !== user.organizationId) {
      return errorResponse('Access denied to this organization', 403)
    }

    // Get project to check ownership
    const project = await projectService.getProjectById(projectId, organizationId)
    if (!project) {
      return notFoundResponse('Project')
    }

    // Check permission to modify
    if (!canModifyProject(user.role, user.id, project.projectManagerId)) {
      return errorResponse('Insufficient permissions to delete this project', 403)
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
