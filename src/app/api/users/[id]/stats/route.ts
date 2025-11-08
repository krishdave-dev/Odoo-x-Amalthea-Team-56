import { NextResponse } from 'next/server'
import { userService } from '@/services/user.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { uuidSchema } from '@/lib/validation'

/**
 * GET /api/users/:id/stats
 * Get statistics and activity for a user
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    uuidSchema.parse(id)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const stats = await userService.getUserStats(id, organizationId)

    return successResponse(stats)
  } catch (error) {
    return handleError(error)
  }
}
