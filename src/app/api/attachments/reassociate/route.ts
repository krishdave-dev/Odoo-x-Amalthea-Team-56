/**
 * API endpoint to reassociate pending attachments to actual owner
 * Used when attachments are uploaded during entity creation
 */

import { NextRequest, NextResponse } from 'next/server'
import { attachmentService } from '@/services/attachmentService'
import { z } from 'zod'
import { errorResponse, successResponse } from '@/lib/response'
import { getCurrentUser } from '@/lib/session'

const reassociateSchema = z.object({
  organizationId: z.number().int().positive(),
  temporaryOwnerId: z.number().int(), // Can be negative for pending entities
  temporaryOwnerType: z.string().min(1),
  actualOwnerId: z.number().int().positive(),
  actualOwnerType: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser()
    
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    const body = await request.json()
    const validated = reassociateSchema.parse(body)

    console.log('🔄 Reassociate request:', validated)

    // Verify user belongs to the organization
    if (user.organizationId !== validated.organizationId) {
      return errorResponse('Unauthorized - Organization mismatch', 403)
    }

    // Reassociate attachments
    const result = await attachmentService.reassociateAttachments(
      validated.organizationId,
      validated.temporaryOwnerId,
      validated.temporaryOwnerType,
      validated.actualOwnerId,
      validated.actualOwnerType
    )

    console.log('🔄 Reassociate result:', result)

    return successResponse({
      message: 'Attachments reassociated successfully',
      ...result,
    })
  } catch (error) {
    console.error('Error reassociating attachments:', error)

    if (error instanceof z.ZodError) {
      return errorResponse('Validation error', 400, error.issues)
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Failed to reassociate attachments',
      500
    )
  }
}
