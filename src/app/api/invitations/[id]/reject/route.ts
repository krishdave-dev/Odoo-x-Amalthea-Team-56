import { NextResponse } from 'next/server'
import { invitationService } from '@/services/invitation.service'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'

/**
 * POST /api/invitations/[id]/reject
 * Reject an invitation
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invitation = await invitationService.rejectInvitation(params.id)

    return successResponse({
      invitation,
      message: 'Invitation rejected',
    })
  } catch (error) {
    return handleError(error)
  }
}
