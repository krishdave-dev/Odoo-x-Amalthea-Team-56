/**
 * Hybrid Attachment Upload API
 * POST /api/v1/attachments/upload - Upload file with Cloudinary + PostgreSQL fallback
 * GET /api/v1/attachments - List attachments with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { attachmentService } from '@/services/attachment.service';
import { createAttachmentSchema, attachmentFiltersSchema } from '@/validations/attachmentSchema';
import { handleError } from '@/lib/error';
import { successResponse } from '@/lib/response';

/**
 * POST /api/v1/attachments/upload
 * Upload a file with hybrid Cloudinary + PostgreSQL fallback
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get file from form data
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'File is required',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Get metadata from form data
    const metadata = {
      organizationId: formData.get('organizationId') as string,
      ownerType: formData.get('ownerType') as string,
      ownerId: formData.get('ownerId') as string,
      fileName: formData.get('fileName') as string | undefined,
      uploadedBy: formData.get('uploadedBy') as string | undefined,
      maxBackupSize: formData.get('maxBackupSize')
        ? parseInt(formData.get('maxBackupSize') as string)
        : undefined,
      createThumbnail: formData.get('createThumbnail') === 'true',
    };

    // Validate metadata
    const validatedData = createAttachmentSchema.parse(metadata);

    // Upload file using hybrid service
    const attachment = await attachmentService.createAttachment(validatedData, file);

    // Remove binary data from response
    const { backupData, ...attachmentResponse } = attachment as any;

    return NextResponse.json(
      successResponse(attachmentResponse, 'File uploaded successfully'),
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/v1/attachments
 * List attachments with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters = attachmentFiltersSchema.parse({
      organizationId: searchParams.get('organizationId'),
      ownerType: searchParams.get('ownerType'),
      ownerId: searchParams.get('ownerId'),
      uploadedBy: searchParams.get('uploadedBy'),
      status: searchParams.get('status'),
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      sort: searchParams.get('sort'),
    });

    const result = await attachmentService.getAttachments(
      filters,
      filters.page,
      filters.pageSize,
      filters.sort
    );

    // Remove binary data from responses
    const sanitizedData = result.data.map((attachment: any) => {
      const { backupData, ...rest } = attachment;
      return rest;
    });

    return NextResponse.json(
      successResponse(
        { ...result, data: sanitizedData },
        `Retrieved ${result.data.length} attachments`
      )
    );
  } catch (error) {
    return handleError(error);
  }
}
