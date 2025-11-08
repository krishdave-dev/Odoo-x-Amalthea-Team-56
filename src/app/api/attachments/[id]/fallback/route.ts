/**
 * GET /api/attachments/:id/fallback
 * Serve fallback data when Cloudinary/CDN is unavailable
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

    const fallback = await attachmentService.getFallbackData(id)

    return new NextResponse(fallback.data, {
      headers: {
        'Content-Type': fallback.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fallback.fileName}"`,
        'Cache-Control': 'no-store, must-revalidate',
        'X-Fallback-Source': 'postgres',
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
