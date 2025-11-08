import { NextResponse } from 'next/server'
import { invitationService } from '@/services/invitation.service'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'

/**
 * GET /api/invitations/token/[token]
 * Get invitation details by token (public endpoint for signup flow)
 */
export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const invitation = await invitationService.getInvitationByToken(params.token)

    if (!invitation) {
      return errorResponse('Invitation not found', 404)
    }

    return successResponse({ invitation })
  } catch (error) {
    return handleError(error)
  }
}
