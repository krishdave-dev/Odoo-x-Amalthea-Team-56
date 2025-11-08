import { NextResponse } from 'next/server'
import { organizationService } from '@/services/organization.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/organizations/:id/stats
 * Get statistics for an organization
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    idSchema.parse(id)

    const stats = await organizationService.getOrganizationStats(id)

    return successResponse(stats)
  } catch (error) {
    return handleError(error)
  }
}
