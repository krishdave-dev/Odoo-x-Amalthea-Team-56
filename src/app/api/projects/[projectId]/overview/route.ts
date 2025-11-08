/**
 * GET /api/projects/:projectId/overview
 * 
 * Get comprehensive project overview with aggregate metrics
 * Supports caching for performance
 */

import { NextResponse } from 'next/server'
import { projectOverviewService } from '@/services/project-overview.service'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const projectIdNum = idSchema.parse(projectId)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    
    if (!organizationId) {
      return errorResponse('organizationId is required', 400)
    }

    const organizationIdNum = idSchema.parse(organizationId)

    // Parse optional query params
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    // Fetch overview
    const overview = await projectOverviewService.getOverview(
      projectIdNum,
      organizationIdNum,
      { forceRefresh }
    )

    return successResponse(overview)
  } catch (error: any) {
    if (error.message === 'Project not found or access denied') {
      return notFoundResponse('Project')
    }
    return handleError(error)
  }
}

/**
 * DELETE /api/projects/:projectId/overview
 * 
 * Invalidate overview cache for a project
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    idSchema.parse(projectId)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    
    if (!organizationId) {
      return errorResponse('organizationId is required', 400)
    }

    const organizationIdNum = idSchema.parse(organizationId)

    // Invalidate cache
    await projectOverviewService.invalidateCache(organizationIdNum)

    return successResponse({ message: 'Cache invalidated successfully' })
  } catch (error: any) {
    return handleError(error)
  }
}
