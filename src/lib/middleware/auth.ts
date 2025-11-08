import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { can, getPermissions } from '@/lib/permissions'
import { errorResponse } from '@/lib/response'
import type { UserRole } from '@/types/enums'
import type { PermissionCheck } from '@/lib/permissions'

export interface AuthenticatedUser {
  id: number
  email: string
  name: string | null
  organizationId: number
  role: UserRole
  isActive: boolean
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean // Require authentication (default: true)
  requirePermissions?: Array<keyof PermissionCheck> // Required permissions (any)
  requireAllPermissions?: Array<keyof PermissionCheck> // All required permissions (all)
  requireRoles?: UserRole[] // Required roles (any)
  allowSameUserOnly?: boolean // Only allow if userId matches authenticated user
}

/**
 * Authentication and authorization middleware for API routes
 * 
 * Usage:
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const { user, error } = await withAuth(req, {
 *     requirePermissions: ['canCreateProjects']
 *   })
 *   
 *   if (error) return error
 *   
 *   // user is now authenticated and authorized
 * }
 * ```
 */
export async function withAuth(
  req: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<{
  user: AuthenticatedUser | null
  error: NextResponse | null
}> {
  const {
    requireAuth = true,
    requirePermissions = [],
    requireAllPermissions = [],
    requireRoles = [],
  } = options

  // Check authentication
  if (requireAuth) {
    const user = await getCurrentUser()

    if (!user) {
      return {
        user: null,
        error: errorResponse('Authentication required. Please log in.', 401),
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        user: null,
        error: errorResponse('Account is inactive. Please contact your administrator.', 403),
      }
    }

    // Check required roles
    if (requireRoles.length > 0 && !requireRoles.includes(user.role)) {
      return {
        user: null,
        error: errorResponse(
          `Access denied. Required role: ${requireRoles.join(' or ')}`,
          403
        ),
      }
    }

    // Check required permissions (any)
    if (requirePermissions.length > 0) {
      const hasAnyPermission = requirePermissions.some((permission) =>
        can(user.role, permission)
      )

      if (!hasAnyPermission) {
        return {
          user: null,
          error: errorResponse(
            `Access denied. Required permission: ${requirePermissions.join(' or ')}`,
            403
          ),
        }
      }
    }

    // Check all required permissions (all must match)
    if (requireAllPermissions.length > 0) {
      const hasAllPermissions = requireAllPermissions.every((permission) =>
        can(user.role, permission)
      )

      if (!hasAllPermissions) {
        return {
          user: null,
          error: errorResponse(
            `Access denied. Missing required permissions.`,
            403
          ),
        }
      }
    }

    return { user, error: null }
  }

  // If requireAuth is false, try to get user but don't require it
  const user = await getCurrentUser()
  return { user, error: null }
}

/**
 * Require admin role
 */
export async function requireAdmin(req: NextRequest) {
  return withAuth(req, { requireRoles: ['admin'] })
}

/**
 * Require manager or admin role
 */
export async function requireManager(req: NextRequest) {
  return withAuth(req, { requireRoles: ['admin', 'manager'] })
}

/**
 * Require finance, manager, or admin role
 */
export async function requireFinance(req: NextRequest) {
  return withAuth(req, { requireRoles: ['admin', 'manager', 'finance'] })
}

/**
 * Check organization access
 * Ensures user can only access resources in their organization
 */
export function checkOrganizationAccess(
  user: AuthenticatedUser,
  resourceOrganizationId: number
): NextResponse | null {
  if (user.organizationId !== resourceOrganizationId) {
    return errorResponse(
      'Access denied. Resource belongs to a different organization.',
      403
    )
  }
  return null
}

/**
 * Check project access
 * - Admins, managers, finance: can access all projects in their org
 * - Members: only projects they're assigned to
 */
export async function checkProjectAccess(
  user: AuthenticatedUser,
  projectId: number,
  prisma: any // PrismaClient
): Promise<NextResponse | null> {
  // Check if user can view all projects
  if (can(user.role, 'canViewAllProjects')) {
    // Verify project belongs to user's organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    })

    if (!project) {
      return errorResponse('Project not found', 404)
    }

    if (project.organizationId !== user.organizationId) {
      return errorResponse('Access denied to this project', 403)
    }

    return null
  }

  // For members, check if they're assigned to the project
  const projectMember = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: user.id,
    },
    include: {
      project: {
        select: { organizationId: true },
      },
    },
  })

  if (!projectMember) {
    return errorResponse('Access denied. You are not assigned to this project.', 403)
  }

  if (projectMember.project.organizationId !== user.organizationId) {
    return errorResponse('Access denied to this project', 403)
  }

  return null
}

/**
 * Check task access
 * - Admins, managers: can access all tasks
 * - Members: only tasks assigned to them
 */
export async function checkTaskAccess(
  user: AuthenticatedUser,
  taskId: number,
  prisma: any // PrismaClient
): Promise<NextResponse | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      assigneeId: true,
      project: {
        select: {
          organizationId: true,
          projectManagerId: true,
        },
      },
    },
  })

  if (!task) {
    return errorResponse('Task not found', 404)
  }

  // Check organization
  if (task.project.organizationId !== user.organizationId) {
    return errorResponse('Access denied to this task', 403)
  }

  // Admins and managers can access all tasks
  if (can(user.role, 'canViewAllTasks')) {
    return null
  }

  // Members can only access tasks assigned to them
  if (user.role === 'member' && task.assigneeId !== user.id) {
    return errorResponse('Access denied. This task is not assigned to you.', 403)
  }

  return null
}

/**
 * Extract and validate query parameter as number
 */
export function getIdFromQuery(
  searchParams: URLSearchParams,
  paramName: string,
  required: boolean = true
): { id: number | null; error: NextResponse | null } {
  const value = searchParams.get(paramName)

  if (!value) {
    if (required) {
      return {
        id: null,
        error: errorResponse(`Missing required parameter: ${paramName}`, 400),
      }
    }
    return { id: null, error: null }
  }

  const id = parseInt(value, 10)
  if (isNaN(id) || id <= 0) {
    return {
      id: null,
      error: errorResponse(`Invalid ${paramName}. Must be a positive integer.`, 400),
    }
  }

  return { id, error: null }
}

/**
 * Extract organizationId from authenticated user
 * This is the recommended way to get organizationId for queries
 */
export function getOrganizationId(user: AuthenticatedUser): number {
  return user.organizationId
}
