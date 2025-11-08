import { NextRequest, NextResponse } from 'next/server'
import { attachmentService } from '@/services/attachment.service'
import { createAttachmentSchema, attachmentFiltersSchema } from '@/validations/attachmentSchema'
import { handleError } from '@/lib/error'

/**
 * GET /api/v1/attachments
 * List attachments with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Parse and validate query parameters
    const filters = attachmentFiltersSchema.parse({
      organizationId: searchParams.get('organizationId') || undefined,
      ownerType: searchParams.get('ownerType') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      uploadedBy: searchParams.get('uploadedBy') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
      sort: searchParams.get('sort') || 'uploadedAt:desc',
    })

    const result = await attachmentService.getAttachments(
      {
        organizationId: filters.organizationId,
        ownerType: filters.ownerType,
        ownerId: filters.ownerId,
        uploadedBy: filters.uploadedBy,
      },
      filters.page,
      filters.pageSize,
      filters.sort
    )

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: `Retrieved ${result.data.length} attachments`,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/v1/attachments/upload
 * Upload file to Cloudinary and create attachment record
 */
export async function POST(req: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await req.formData()
    
    // Extract file
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

    // Extract and validate metadata
    const organizationId = formData.get('organizationId') as string
    const ownerType = formData.get('ownerType') as string
    const ownerId = formData.get('ownerId') as string
    const fileName = (formData.get('fileName') as string) || undefined
    const uploadedBy = (formData.get('uploadedBy') as string) || undefined

    const validated = createAttachmentSchema.parse({
      organizationId,
      ownerType,
      ownerId,
      fileName,
      uploadedBy,
    })

    // Upload file and create attachment
    const attachment = await attachmentService.createAttachment(validated, file)

    return NextResponse.json(
      {
        success: true,
        data: attachment,
        message: 'File uploaded successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
}
