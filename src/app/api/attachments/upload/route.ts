/**
 * POST /api/attachments/upload
 * Upload file with Cloudinary primary + PostgreSQL preview fallback
 */

import { NextRequest, NextResponse } from 'next/server'
import { attachmentService } from '@/services/attachmentService'
import { handleError } from '@/lib/error'
import { z } from 'zod'
import { idSchema } from '@/lib/validation'

const uploadSchema = z.object({
  organizationId: idSchema,
  ownerType: z.string().min(1, 'Owner type is required').max(50),
  ownerId: idSchema,
  uploadedBy: idSchema.optional(),
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Get file
    const file = formData.get('file') as File | null

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
      )
    }

    // Get metadata
    const metadata = {
      organizationId: formData.get('organizationId') as string,
      ownerType: formData.get('ownerType') as string,
      ownerId: formData.get('ownerId') as string,
      uploadedBy: (formData.get('uploadedBy') as string) || undefined,
    }

    // Validate metadata
    const validatedData = uploadSchema.parse(metadata)

    // Upload file
    const result = await attachmentService.uploadFile({
      file,
      ...validatedData,
    })

    return NextResponse.json(
      {
        success: true,
        data: result,
        message:
          result.status === 'active'
            ? 'File uploaded successfully'
            : 'File queued for upload (will retry)',
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
}
