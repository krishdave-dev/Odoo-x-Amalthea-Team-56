import { NextResponse } from 'next/server'
import { projectService } from '@/services/project.service'
import { paginatedResponse, createdResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
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
    const { searchParams } = new URL(req.url)
    const query = parseQuery(searchParams, projectQuerySchema)
    
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const result = await projectService.getProjects(
      organizationId,
      query.page,
      query.pageSize,
      {
        status: query.status,
        projectManagerId: query.managerId,
        search: query.q,
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
 */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, createProjectSchema)

    const project = await projectService.createProject(body)

    return createdResponse(project)
  } catch (error) {
    return handleError(error)
  }
}

