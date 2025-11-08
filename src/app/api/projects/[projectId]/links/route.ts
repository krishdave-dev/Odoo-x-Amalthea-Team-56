/**
 * GET /api/projects/:projectId/links
 * 
 * Fetch all linked entities for a project in one call
 * Supports the "Links Panel" feature
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

    // Parse optional query params
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 5

    const include = searchParams.get('include')
      ? searchParams.get('include')!.split(',') as any[]
      : undefined

    // Fetch links
    const links = await projectLinksService.getProjectLinks(
      projectIdNum,
      organizationIdNum,
      { limit, include }
    )

    return successResponse(links)
  } catch (error: any) {
    if (error.message === 'Project not found or access denied') {
      return notFoundResponse('Project')
    }
    return handleError(error)
  }
}
