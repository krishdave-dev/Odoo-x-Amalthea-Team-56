import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditEvent } from '@/lib/db-helpers'
import {
  successResponse,
  paginatedResponse,
  createdResponse,
  notFoundResponse,
  noContentResponse,
  conflictResponse,
} from '@/lib/response'
import { handleError, ConflictError, NotFoundError } from '@/lib/error'
import {
  createProjectMemberSchema,
  updateProjectMemberSchema,
  parseBody,
  uuidSchema,
} from '@/lib/validation'

/**
 * GET /api/projects/:projectId/members
 * List all members of a project
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    uuidSchema.parse(projectId)

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            hourlyRate: true,
            isActive: true,
          },
        },
      },
      orderBy: { assignedAt: 'asc' },
    })

    return successResponse(members)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/projects/:projectId/members
 * Add a member to a project
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    uuidSchema.parse(projectId)

    const body = await parseBody(req, createProjectMemberSchema)

    // Verify project exists and get organization
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: { organizationId: true },
    })

    if (!project) {
      throw new NotFoundError('Project')
    }

    // Verify user exists and belongs to same organization
    const user = await prisma.user.findFirst({
      where: {
        id: body.userId,
        organizationId: project.organizationId,
        deletedAt: null,
      },
    })

    if (!user) {
      throw new NotFoundError('User or user does not belong to this organization')
    }

    // Check if member already exists
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: body.userId,
        },
      },
    })

    if (existing) {
      throw new ConflictError('User is already a member of this project')
    }

    // Add member
    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.projectMember.create({
        data: {
          projectId,
          userId: body.userId,
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
        newMember.id,
        'project_member.added',
        { projectId, userId: body.userId, role: body.roleInProject }
      )

      return newMember
    })

    return createdResponse(member)
  } catch (error) {
    return handleError(error)
  }
}
