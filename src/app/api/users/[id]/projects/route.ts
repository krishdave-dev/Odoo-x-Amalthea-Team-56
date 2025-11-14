import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/users/:id/projects
 * Get all projects and tasks assigned to a user
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return errorResponse('Authentication required', 401)
    }

    const { id } = await params
    idSchema.parse(id)
    const userId = parseInt(id, 10)

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      )
    }

    // Check organization access
    if (parseInt(organizationId) !== currentUser.organizationId) {
      return errorResponse('Access denied to this organization', 403)
    }

    // Verify user belongs to the organization
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: parseInt(organizationId),
        deletedAt: null,
      },
    })

    if (!user) {
      return errorResponse('User not found', 404)
    }

    // Get projects where user is a member or project manager
    const projectMembers = await prisma.projectMember.findMany({
      where: {
        userId,
        project: {
          organizationId: parseInt(organizationId),
          deletedAt: null,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    })

    const managedProjects = await prisma.project.findMany({
      where: {
        projectManagerId: userId,
        organizationId: parseInt(organizationId),
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
      },
    })

    // Combine and deduplicate projects
    const projectMap = new Map<number, any>()

    // Add member projects
    projectMembers.forEach((pm) => {
      projectMap.set(pm.project.id, {
        ...pm.project,
        roleInProject: pm.roleInProject,
      })
    })

    // Add managed projects
    managedProjects.forEach((project) => {
      if (!projectMap.has(project.id)) {
        projectMap.set(project.id, {
          ...project,
          roleInProject: 'Project Manager',
        })
      } else {
        // Update role if already exists
        const existing = projectMap.get(project.id)
        projectMap.set(project.id, {
          ...existing,
          roleInProject: 'Project Manager',
        })
      }
    })

    const projectIds = Array.from(projectMap.keys())

    // Get tasks for each project assigned to this user
    const projectsWithTasks = await Promise.all(
      projectIds.map(async (projectId) => {
        const project = projectMap.get(projectId)

        const tasks = await prisma.task.findMany({
          where: {
            projectId,
            assigneeId: userId,
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            hoursLogged: true,
          },
          orderBy: [
            { status: 'asc' },
            { priority: 'desc' },
            { dueDate: 'asc' },
          ],
        })

        return {
          id: project.id,
          name: project.name,
          code: project.code,
          status: project.status,
          roleInProject: project.roleInProject,
          tasks: tasks.map((task) => ({
            ...task,
            hoursLogged: Number(task.hoursLogged),
          })),
        }
      })
    )

    // Sort projects by number of tasks (descending) and then by name
    projectsWithTasks.sort((a, b) => {
      if (b.tasks.length !== a.tasks.length) {
        return b.tasks.length - a.tasks.length
      }
      return a.name.localeCompare(b.name)
    })

    return successResponse(projectsWithTasks)
  } catch (error) {
    return handleError(error)
  }
}
