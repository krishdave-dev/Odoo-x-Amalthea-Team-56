import { NextRequest } from 'next/server'
import { cacheService } from '@/services/cache.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * DELETE /api/analytics/cache
 * 
 * Invalidate analytics cache
 * Query params:
 * - organizationId (required)
 * - cacheType (optional): Specific cache type to invalidate
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const cacheType = searchParams.get('cacheType') as any

    await cacheService.invalidate(organizationId, cacheType)

    return successResponse({
      message: cacheType
        ? `Cache invalidated for ${cacheType}`
        : 'All caches invalidated for organization',
      organizationId,
      cacheType: cacheType || 'all',
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/analytics/cache
 * 
 * Get cache statistics
 * Query params:
 * - organizationId (optional): Filter by organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
      ? idSchema.parse(searchParams.get('organizationId'))
      : undefined

    const stats = await cacheService.getStats(organizationId)

    return successResponse({
      ...stats,
      organizationId,
    })
  } catch (error) {
    return handleError(error)
  }
}
