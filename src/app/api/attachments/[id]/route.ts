/**
 * GET /api/attachments/:id
 * Get attachment metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { attachmentService } from '@/services/attachmentService'
import { handleError } from '@/lib/error'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const attachment = await attachmentService.getAttachmentById(id)

    return NextResponse.json({
      success: true,
      data: attachment,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/attachments/:id
 * Soft delete attachment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // TODO: Get userId from auth
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
