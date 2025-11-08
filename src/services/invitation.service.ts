import { prisma } from '@/lib/prisma'
import type { OrganizationInvitation } from '@prisma/client'
import { getAllowedInvitationRoles } from '@/lib/permissions'
import type { UserRole } from '@/types/enums'
import { NotificationService } from './notification.service'

export interface CreateInvitationInput {
  organizationId: number
  email: string
  role: string
  invitedById: number
}

export interface InvitationWithDetails extends OrganizationInvitation {
  organization: {
    id: number
    name: string
  }
  invitedBy: {
    id: number
    name: string | null
    email: string
  }
}

/**
 * Invitation Service - handles organization invitation business logic
 */
export class InvitationService {
  /**
   * Create a new invitation
   */
  async createInvitation(input: CreateInvitationInput, inviterRole: UserRole | string): Promise<OrganizationInvitation> {
    const { organizationId, email, role, invitedById } = input

    // Check if inviter has permission to invite this role
    const allowedRoles = getAllowedInvitationRoles(inviterRole)
    if (!allowedRoles.includes(role)) {
      throw new Error(`You don't have permission to invite users with role: ${role}`)
    }

    // Check if user already exists in organization
    const existingUser = await prisma.user.findUnique({
      where: {
        organizationId_email: {
          organizationId,
          email,
        },
      },
    })

    if (existingUser) {
      throw new Error('User with this email already exists in the organization')
    }

    // Check if user exists in database (for in-app notification)
    const userAccount = await prisma.user.findFirst({
      where: { email },
      select: { id: true, name: true, organizationId: true },
    })

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.organizationInvitation.findUnique({
      where: {
        organizationId_email: {
          organizationId,
          email,
        },
      },
    })

    if (existingInvitation && existingInvitation.status === 'pending') {
      throw new Error('An invitation has already been sent to this email')
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.$transaction(async (tx) => {
      // Delete any old invitations to this email
      await tx.organizationInvitation.deleteMany({
        where: {
          organizationId,
          email,
        },
      })

      // Create new invitation
      const newInvitation = await tx.organizationInvitation.create({
        data: {
          organizationId,
          email,
          role: role as any, // Cast to UserRole enum
          invitedById,
          expiresAt,
        },
      })

      // Create audit event
      await tx.event.create({
        data: {
          organizationId,
          entityType: 'invitation',
          entityId: newInvitation.id,
          eventType: 'invitation.created',
          payload: {
            email,
            role,
            invitedById,
          },
        },
      })

      return newInvitation
    })

    // If user exists in system, send in-app notification
    if (userAccount) {
      const inviter = await prisma.user.findUnique({
        where: { id: invitedById },
        select: { name: true },
      })

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      })

      if (inviter && organization) {
        await NotificationService.notifyInvitationReceived(
          organizationId,
          userAccount.id,
          invitation.id,
          organization.name,
          role,
          inviter.name || 'Admin'
        )
      }
    }
    // TODO: If user doesn't exist, send email invitation

    return invitation
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<InvitationWithDetails | null> {
    return prisma.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Get all invitations for an organization
   */
  async getOrganizationInvitations(
    organizationId: number,
    status?: 'pending' | 'accepted' | 'rejected' | 'expired'
  ): Promise<InvitationWithDetails[]> {
    return prisma.organizationInvitation.findMany({
      where: {
        organizationId,
        ...(status && { status }),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string, userId: number): Promise<OrganizationInvitation> {
    const invitation = await this.getInvitationByToken(token)

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    if (invitation.status !== 'pending') {
      throw new Error(`Invitation is ${invitation.status}`)
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      })
      throw new Error('Invitation has expired')
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update invitation status
      const updatedInvitation = await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
        },
      })

      // Create audit event
      await tx.event.create({
        data: {
          organizationId: invitation.organizationId,
          entityType: 'invitation',
          entityId: invitation.id,
          eventType: 'invitation.accepted',
          payload: {
            userId,
            email: invitation.email,
          },
        },
      })

      return updatedInvitation
    })

    return updated
  }

  /**
   * Reject an invitation
   */
  async rejectInvitation(token: string): Promise<OrganizationInvitation> {
    const invitation = await this.getInvitationByToken(token)

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    if (invitation.status !== 'pending') {
      throw new Error(`Invitation is ${invitation.status}`)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedInvitation = await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'rejected' },
      })

      await tx.event.create({
        data: {
          organizationId: invitation.organizationId,
          entityType: 'invitation',
          entityId: invitation.id,
          eventType: 'invitation.rejected',
          payload: {
            email: invitation.email,
          },
        },
      })

      return updatedInvitation
    })

    return updated
  }

  /**
   * Revoke/cancel an invitation (only by inviter or admin)
   */
  async revokeInvitation(invitationId: number, organizationId: number): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.organizationInvitation.delete({
          where: {
            id: invitationId,
            organizationId, // Ensure it belongs to the org
          },
        })

        await tx.event.create({
          data: {
            organizationId,
            entityType: 'invitation',
            entityId: invitationId,
            eventType: 'invitation.revoked',
            payload: {},
          },
        })
      })

      return true
    } catch (error) {
      console.error('Failed to revoke invitation:', error)
      return false
    }
  }

  /**
   * Clean up expired invitations (can be run via cron job)
   */
  async expireOldInvitations(): Promise<number> {
    const result = await prisma.organizationInvitation.updateMany({
      where: {
        status: 'pending',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'expired',
      },
    })

    return result.count
  }
}

export const invitationService = new InvitationService()
