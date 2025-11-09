import { NextResponse } from 'next/server'
import { invitationService } from '@/services/invitation.service'
import { getCurrentUser } from '@/lib/session'
import { can } from '@/lib/permissions'
import { successResponse, errorResponse, createdResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { z } from 'zod'

// Schema for creating invitation
const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'member', 'finance']),
})

/**
 * GET /api/invitations
 * List all invitations for the user's organization
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    // Check permission
    if (!can(user.role, 'canInviteUsers')) {
      return errorResponse('Insufficient permissions to view invitations', 403)
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as 'pending' | 'accepted' | 'rejected' | 'expired' | null

    const invitations = await invitationService.getOrganizationInvitations(
      user.organizationId,
      status || undefined
    )

    return successResponse(invitations)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/invitations
 * Send a new invitation
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    // Check permission
    if (!can(user.role, 'canInviteUsers')) {
      return errorResponse('Insufficient permissions to send invitations', 403)
    }

    const body = await req.json()
    const { email, role } = createInvitationSchema.parse(body)

    const invitation = await invitationService.createInvitation(
      {
        organizationId: user.organizationId,
        email,
        role,
        invitedById: user.id,
      },
      user.role
    )

    return createdResponse({
      invitation,
      message: 'Invitation sent successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
