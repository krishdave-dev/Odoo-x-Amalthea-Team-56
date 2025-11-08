import { NextRequest, NextResponse } from 'next/server'
import { attachmentService } from '@/services/attachment.service'
import { handleError } from '@/lib/error'

/**
 * GET /api/v1/attachments/owner/[ownerType]/[ownerId]
 * Get all attachments for a specific owner
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ownerType: string; ownerId: string }> }
) {
  try {
    const { ownerType, ownerId } = await params
    const { searchParams } = new URL(req.url)
    
    const organizationId = searchParams.get('organizationId') || undefined

    const attachments = await attachmentService.getAttachmentsByOwner(
      ownerType,
      ownerId,
      organizationId
    )

    return NextResponse.json({
      success: true,
      data: attachments,
      message: `Retrieved ${attachments.length} attachments for ${ownerType}`,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/v1/attachments/owner/[ownerType]/[ownerId]
 * Delete all attachments for a specific owner
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ ownerType: string; ownerId: string }> }
) {
  try {
    const { ownerType, ownerId } = await params
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

    // Optional: Get userId from request (when auth is implemented)
    const userId = undefined

    const result = await attachmentService.deleteAttachmentsByOwner(
      ownerType,
      ownerId,
      organizationId,
      userId
    )

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} attachments`,
      data: result,
    })
  } catch (error) {
    return handleError(error)
  }
}
