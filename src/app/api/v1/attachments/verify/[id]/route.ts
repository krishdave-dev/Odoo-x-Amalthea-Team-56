/**
 * POST /api/v1/attachments/verify/:id
 * Verify if Cloudinary file still exists and update status
 */

import { NextRequest, NextResponse } from 'next/server';
import { attachmentService } from '@/services/attachment.service';
import { handleError } from '@/lib/error';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await attachmentService.verifyAttachment(id);

    return NextResponse.json({
      success: true,
      data: result,
      message: result.verified
        ? 'File verified successfully'
        : 'File not found in Cloudinary',
    });
  } catch (error) {
    return handleError(error);
  }
}
