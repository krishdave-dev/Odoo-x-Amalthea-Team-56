import { NextResponse } from 'next/server'
import { invitationService } from '@/services/invitation.service'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'

/**
 * POST /api/invitations/[id]/accept
 * Accept an invitation (called during signup)
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return errorResponse('User ID is required', 400)
    }

    const invitation = await invitationService.acceptInvitation(params.id, userId)

    return successResponse({
      invitation,
      message: 'Invitation accepted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
