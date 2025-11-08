import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/services/project.service'
import type { ApiResponse } from '@/types/common'

/**
 * GET /api/projects
 * Get all projects for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const organizationId = searchParams.get('organizationId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status') || undefined
    const projectManagerId = searchParams.get('projectManagerId') || undefined
    const search = searchParams.get('search') || undefined

    if (!organizationId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const result = await projectService.getProjects(
      organizationId,
      page,
      pageSize,
      { status, projectManagerId, search }
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result.data,
      message: `Retrieved ${result.data.length} projects`,
    })
  } catch (error) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.organizationId || !body.name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Organization ID and name are required' },
        { status: 400 }
      )
    }

    const project = await projectService.createProject({
      organizationId: body.organizationId,
      name: body.name,
      code: body.code,
      description: body.description,
      projectManagerId: body.projectManagerId,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      budget: body.budget,
      status: body.status,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: project,
        message: 'Project created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/projects error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      },
      { status: 500 }
    )
  }
}
