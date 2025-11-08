/**
 * GET /api/projects/:projectId/health
 * 
 * Get project health score and indicators
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

    // Fetch health score
    const health = await projectOverviewService.getProjectHealth(
      projectIdNum,
      organizationIdNum
    )

    return successResponse(health)
  } catch (error: any) {
    if (error.message === 'Project not found or access denied') {
      return notFoundResponse('Project')
    }
    return handleError(error)
  }
}
