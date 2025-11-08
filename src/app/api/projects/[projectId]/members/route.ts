import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditEvent } from '@/lib/db-helpers'
import { getCurrentUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import {
  successResponse,
  paginatedResponse,
  createdResponse,
  notFoundResponse,
  noContentResponse,
  conflictResponse,
  errorResponse,
} from '@/lib/response'
import { handleError, ConflictError, NotFoundError } from '@/lib/error'
import {
  createProjectMemberSchema,
  updateProjectMemberSchema,
  parseBody,
  idSchema,
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
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    const { projectId } = await params
    const parsedProjectId = idSchema.parse(projectId)

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: parsedProjectId, deletedAt: null },
      select: { organizationId: true, projectManagerId: true },
    })

    if (!project) {
      return notFoundResponse('Project')
    }

    if (project.organizationId !== user.organizationId) {
      return errorResponse('Access denied to this organization', 403)
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId: parsedProjectId },
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
 * - Only admins and the project manager can add members
 * - Managers can only add members to projects they manage
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    const { projectId } = await params
    const parsedProjectId = idSchema.parse(projectId)

    const body = await parseBody(req, createProjectMemberSchema)

    // Verify project exists and get details
    const project = await prisma.project.findUnique({
      where: { id: parsedProjectId, deletedAt: null },
      select: { 
        organizationId: true,
        projectManagerId: true,
        name: true,
      },
    })

    if (!project) {
      throw new NotFoundError('Project')
    }

    // Check organization access
    if (project.organizationId !== user.organizationId) {
      return errorResponse('Access denied to this organization', 403)
    }

    // Permission check: Only admin or the project manager can add members
    const isAdmin = user.role === 'admin'
    const isProjectManager = project.projectManagerId === user.id

    if (!isAdmin && !isProjectManager) {
      return errorResponse('Only admins or the project manager can add members to this project', 403)
    }

    // Verify user to be added exists and belongs to same organization
    const memberUser = await prisma.user.findFirst({
      where: {
        id: body.userId,
        organizationId: project.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (!memberUser) {
      throw new NotFoundError('User or user does not belong to this organization')
    }

    // Check if member already exists
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: parsedProjectId,
          userId: body.userId,
        },
      },
    })

    if (existing) {
      throw new ConflictError('User is already a member of this project')
    }

    // Add member
    const member = await prisma.$transaction(async (tx: any) => {
      const newMember = await tx.projectMember.create({
        data: {
          projectId: parsedProjectId,
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
        { 
          projectId: parsedProjectId, 
          userId: body.userId, 
          role: body.roleInProject,
          addedBy: user.id,
          addedByRole: user.role,
        }
      )

      return newMember
    })

    return createdResponse(member)
  } catch (error) {
    return handleError(error)
  }
}
