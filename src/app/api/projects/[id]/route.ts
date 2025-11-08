import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/services/project.service'
import type { ApiResponse } from '@/types/common'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/projects/[id]
 * Get a single project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const project = await projectService.getProjectById(id, organizationId)

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/projects/[id]
 * Update a project
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.organizationId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    if (body.version === undefined) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Version is required for optimistic locking' },
        { status: 400 }
      )
    }

    const result = await projectService.updateProject(
      id,
      body.organizationId,
      body.version,
      {
        name: body.name,
        code: body.code,
        description: body.description,
        projectManagerId: body.projectManagerId,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        budget: body.budget,
        status: body.status,
        progressPct: body.progressPct,
      }
    )

    if (!result.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: result.error },
        { status: 409 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result.project,
      message: 'Project updated successfully',
    })
  } catch (error) {
    console.error('PUT /api/projects/[id] error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update project',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id]
 * Soft delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const deleted = await projectService.deleteProject(id, organizationId)

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete project' },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete project',
      },
      { status: 500 }
    )
  }
}
