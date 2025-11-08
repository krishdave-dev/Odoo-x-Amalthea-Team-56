/**
 * GET /api/attachments/:id/preview
 * Serve preview/thumbnail stored in PostgreSQL
 */

import { NextRequest, NextResponse } from 'next/server'
import { attachmentService } from '@/services/attachmentService'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const attachmentId = idSchema.parse(id)

    const preview = await attachmentService.getPreviewData(attachmentId)

    return new NextResponse(preview.data, {
      headers: {
        'Content-Type': preview.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${preview.fileName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
