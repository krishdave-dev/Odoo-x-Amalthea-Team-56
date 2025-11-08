import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditEvent } from '@/lib/db-helpers'
import {
  successResponse,
  notFoundResponse,
  noContentResponse,
} from '@/lib/response'
import { handleError, NotFoundError } from '@/lib/error'
import { updateProjectMemberSchema, parseBody, idSchema } from '@/lib/validation'

/**
 * GET /api/projects/:projectId/members/:userId
 * Get a specific project member
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  try {
    const { projectId, userId } = await params
    idSchema.parse(projectId)
    idSchema.parse(userId)

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            hourlyRate: true,
          },
        },
      },
    })

    if (!member) {
      return notFoundResponse('Project member')
    }

    return successResponse(member)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/projects/:projectId/members/:userId
 * Update a project member's role
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  try {
    const { projectId, userId } = await params
    idSchema.parse(projectId)
    idSchema.parse(userId)

    const body = await parseBody(req, updateProjectMemberSchema)

    // Get project to access organizationId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    })

    if (!project) {
      throw new NotFoundError('Project')
    }

    const member = await prisma.$transaction(async (tx) => {
      const updated = await tx.projectMember.update({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
        data: {
          roleInProject: body.roleInProject,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      })

      await createAuditEvent(
        project.organizationId,
        'project_member',
        updated.id,
        'project_member.updated',
        { projectId, userId, changes: body }
      )

      return updated
    })

    return successResponse(member)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/projects/:projectId/members/:userId
 * Remove a member from a project
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  try {
    const { projectId, userId } = await params
    idSchema.parse(projectId)
    idSchema.parse(userId)

    // Get project to access organizationId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    })

    if (!project) {
      throw new NotFoundError('Project')
    }

    await prisma.$transaction(async (tx) => {
      const deleted = await tx.projectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      })

      await createAuditEvent(
        project.organizationId,
        'project_member',
        deleted.id,
        'project_member.removed',
        { projectId, userId }
      )
    })

    return noContentResponse()
  } catch (error) {
    return handleError(error)
  }
}
