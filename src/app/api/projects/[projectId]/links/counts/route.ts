/**
 * GET /api/projects/:projectId/links/counts
 * 
 * Get counts for all linked entities (for dashboard badges)
 */

import { NextResponse } from 'next/server'
import { projectLinksService } from '@/services/project-links.service'
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

    // Fetch counts
    const counts = await projectLinksService.getProjectLinksCounts(
      projectIdNum,
      organizationIdNum
    )

    return successResponse(counts)
  } catch (error: any) {
    if (error.message === 'Project not found or access denied') {
      return notFoundResponse('Project')
    }
    return handleError(error)
  }
}
