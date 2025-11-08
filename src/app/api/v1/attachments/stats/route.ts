import { NextRequest, NextResponse } from 'next/server'
import { attachmentService } from '@/services/attachment.service'
import { handleError } from '@/lib/error'

/**
 * GET /api/v1/attachments/stats
 * Get attachment statistics for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'organizationId is required',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      )
    }

    const stats = await attachmentService.getAttachmentStats(organizationId)

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Retrieved attachment statistics',
    })
  } catch (error) {
    return handleError(error)
  }
}
