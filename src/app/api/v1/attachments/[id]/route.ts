import { NextRequest, NextResponse } from 'next/server'
import { attachmentService } from '@/services/attachment.service'
import { handleError, notFoundError } from '@/lib/error'

/**
 * GET /api/v1/attachments/[id]
 * Get single attachment by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const attachment = await attachmentService.getAttachmentById(id)

    if (!attachment) {
      return notFoundError('Attachment not found')
    }

    return NextResponse.json({
      success: true,
      data: attachment,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/v1/attachments/[id]
 * Delete attachment from Cloudinary and database
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Optional: Get userId from request (when auth is implemented)
    // const userId = req.headers.get('x-user-id') || undefined
    const userId = undefined

    await attachmentService.deleteAttachment(id, userId)

    return NextResponse.json({
      success: true,
      message: 'Attachment deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
