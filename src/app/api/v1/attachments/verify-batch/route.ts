/**
 * POST /api/v1/attachments/verify-batch
 * Batch verify attachments (for scheduled jobs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { attachmentService } from '@/services/attachment.service';
import { handleError } from '@/lib/error';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    const result = await attachmentService.batchVerifyAttachments(organizationId, limit);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Verified ${result.verified} attachments`,
    });
  } catch (error) {
    return handleError(error);
  }
}
