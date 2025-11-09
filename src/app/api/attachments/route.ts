/**
 * GET /api/attachments
 * List attachments by owner (task, project, expense, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { attachmentService } from '@/services/attachmentService'
import { handleError } from '@/lib/error'
import { z } from 'zod'
import { idSchema } from '@/lib/validation'

// Allow negative IDs for pending entities (e.g., pending_project)
const ownerIdSchema = z.coerce.number().int()

const querySchema = z.object({
  ownerType: z.string().min(1),
  ownerId: ownerIdSchema,
  organizationId: idSchema.optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const params = {
      ownerType: searchParams.get('ownerType'),
      ownerId: searchParams.get('ownerId'),
      organizationId: searchParams.get('organizationId'),
    }

    // Validate
    const validatedData = querySchema.parse(params)

    // Fetch attachments
    const attachments = await attachmentService.listAttachmentsByOwner(
      validatedData.ownerType,
      validatedData.ownerId,
      validatedData.organizationId
    )

    return NextResponse.json({
      success: true,
      data: attachments,
    })
  } catch (error) {
    return handleError(error)
  }
}
