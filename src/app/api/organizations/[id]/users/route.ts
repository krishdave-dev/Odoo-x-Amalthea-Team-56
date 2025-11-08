import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { errorResponse, successResponse } from '@/lib/response'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/organizations/[id]/users
 * Get all users in an organization
 * Accessible by: admin, manager (for assigning to projects)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    const organizationId = parseInt(params.id)
    if (isNaN(organizationId)) {
      return errorResponse('Invalid organization ID', 400)
    }

    // Verify user has access to this organization
    if (user.organizationId !== organizationId) {
      return errorResponse('Access denied to this organization', 403)
    }

    // Only admin and manager can view full user list
    if (user.role !== 'admin' && user.role !== 'manager') {
      return errorResponse('Only admins and managers can view organization users', 403)
    }

    const { searchParams } = new URL(req.url)
    const roleFilter = searchParams.get('role')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Build where clause
    const where: any = {
      organizationId,
      deletedAt: null,
    }

    if (activeOnly) {
      where.isActive = true
    }

    if (roleFilter) {
      where.role = roleFilter
    }

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        hourlyRate: true,
        createdAt: true,
        // Include project assignments for context
        managedProjects: {
          select: {
            id: true,
            name: true,
          },
        },
        projectMembers: {
          select: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // admin, finance, manager, member
        { name: 'asc' },
      ],
    })

    // Transform data to include project counts
    const usersWithStats = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      hourlyRate: u.hourlyRate,
      createdAt: u.createdAt,
      managedProjectsCount: u.managedProjects.length,
      assignedProjectsCount: u.projectMembers.length,
      projects: u.projectMembers.map(pm => pm.project),
    }))

    return successResponse({
      users: usersWithStats,
      total: usersWithStats.length,
    })
  } catch (error: any) {
    console.error('[API] Get organization users error:', error)
    return errorResponse(error.message || 'Failed to fetch organization users', 500)
  }
}
