import { NextResponse } from 'next/server'
import { projectService } from '@/services/project.service'
import { paginatedResponse, createdResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { getCurrentUser } from '@/lib/session'
import { can, canAccessProject } from '@/lib/permissions'
import {
  createProjectSchema,
  parseBody,
  parseQuery,
  projectQuerySchema,
} from '@/lib/validation'

/**
 * GET /api/projects
 * Get all projects for an organization with pagination and filters
 * Query params: organizationId, page, pageSize, q (search), status, managerId
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    const { searchParams } = new URL(req.url)
    const query = parseQuery(searchParams, projectQuerySchema)
    
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

    const result = await projectService.getProjects(
      organizationId,
      query.page,
      query.pageSize,
      {
        status: query.status,
        projectManagerId: query.managerId?.toString(),
        search: query.q,
        // Members can only see projects they're assigned to
        userId: can(user.role, 'canViewAllProjects') ? undefined : user.id,
      }
    )

    return paginatedResponse(result)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/projects
 * Create a new project
 * Requires: canCreateProjects permission (admin or manager)
 * Note: Only admins can assign project managers
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    // Check permission
    if (!can(user.role, 'canCreateProjects')) {
      return errorResponse('Insufficient permissions to create projects', 403)
    }

    const body = await parseBody(req, createProjectSchema)

    // Only admins can assign project managers to other users
    // Managers can only assign themselves
    if (body.projectManagerId && user.role !== 'admin') {
      // If manager is trying to assign someone else, deny it
      if (body.projectManagerId !== user.id) {
        return errorResponse('Only admins can assign project managers to other users', 403)
      }
    }

    // If manager creates project without specifying PM, they become the PM
    const projectManagerId = body.projectManagerId 
      ? body.projectManagerId.toString() 
      : (user.role === 'manager' ? user.id.toString() : undefined)

    // Ensure project is created in user's organization
    const project = await projectService.createProject({
      ...body,
      organizationId: user.organizationId.toString(),
      projectManagerId,
    })

    return createdResponse(project)
  } catch (error) {
    return handleError(error)
  }
}

