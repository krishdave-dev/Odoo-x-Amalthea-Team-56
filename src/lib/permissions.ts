import type { UserRole } from '@/types/enums'

/**
 * Role-based permission system
 * Defines what each role can do in the system
 */

export interface PermissionCheck {
  canManageProjects: boolean
  canManageTasks: boolean
  canManageFinance: boolean
  canApproveExpenses: boolean
  canViewAllProjects: boolean
  canManageUsers: boolean
  canManageOrganization: boolean
  canInviteUsers: boolean
  canCreateOrganization: boolean
}

/**
 * Get permissions for a given role
 */
export function getPermissions(role: UserRole | string): PermissionCheck {
  const userRole = typeof role === 'string' ? (role as UserRole) : role

  switch (userRole) {
    case 'admin':
      return {
        canManageProjects: true,
        canManageTasks: true,
        canManageFinance: true,
        canApproveExpenses: true,
        canViewAllProjects: true,
        canManageUsers: true,
        canManageOrganization: true,
        canInviteUsers: true,
        canCreateOrganization: true,
      }

    case 'manager':
      return {
        canManageProjects: true, // Create/edit projects
        canManageTasks: true, // Assign people, manage tasks
        canManageFinance: false, // Cannot manage SO/PO/Invoices/Bills directly
        canApproveExpenses: true, // Approve expenses
        canViewAllProjects: true, // View all projects
        canManageUsers: false,
        canManageOrganization: false,
        canInviteUsers: true, // Can invite members
        canCreateOrganization: false,
      }

    case 'finance':
      return {
        canManageProjects: false,
        canManageTasks: false,
        canManageFinance: true, // Create/link SO/PO/Invoices/Bills/Expenses
        canApproveExpenses: true, // Can approve expenses
        canViewAllProjects: true, // Need to see projects for finance
        canManageUsers: false,
        canManageOrganization: false,
        canInviteUsers: true, // Can invite finance people
        canCreateOrganization: false,
      }

    case 'member':
      return {
        canManageProjects: false,
        canManageTasks: false, // Can only update assigned tasks
        canManageFinance: false,
        canApproveExpenses: false,
        canViewAllProjects: false, // Only see assigned projects
        canManageUsers: false,
        canManageOrganization: false,
        canInviteUsers: false,
        canCreateOrganization: false,
      }

    default:
      // Default to most restrictive permissions
      return {
        canManageProjects: false,
        canManageTasks: false,
        canManageFinance: false,
        canApproveExpenses: false,
        canViewAllProjects: false,
        canManageUsers: false,
        canManageOrganization: false,
        canInviteUsers: false,
        canCreateOrganization: false,
      }
  }
}

/**
 * Check if user can perform a specific action
 */
export function can(role: UserRole | string, permission: keyof PermissionCheck): boolean {
  const permissions = getPermissions(role)
  return permissions[permission]
}

/**
 * Require permission or throw error
 */
export function requirePermission(
  role: UserRole | string,
  permission: keyof PermissionCheck,
  message?: string
): void {
  if (!can(role, permission)) {
    throw new Error(message || `Insufficient permissions: ${permission} required`)
  }
}

/**
 * Check if user can access a project
 * - Admins, managers, finance: can access all projects
 * - Members: only projects they're assigned to
 */
export function canAccessProject(
  role: UserRole | string,
  userId: number,
  projectMemberIds: number[] = []
): boolean {
  if (can(role, 'canViewAllProjects')) {
    return true
  }

  // Members can only access projects they're part of
  return projectMemberIds.includes(userId)
}

/**
 * Check if user can modify a project
 * - Admins: can modify all
 * - Managers: can modify projects they manage
 * - Others: cannot modify
 */
export function canModifyProject(
  role: UserRole | string,
  userId: number,
  projectManagerId?: number | null
): boolean {
  if (role === 'admin') {
    return true
  }

  if (role === 'manager') {
    return projectManagerId === userId
  }

  return false
}

/**
 * Check if user can manage tasks
 * - Admins: all tasks
 * - Managers: tasks in projects they manage
 * - Members: only tasks assigned to them
 */
export function canModifyTask(
  role: UserRole | string,
  userId: number,
  taskAssigneeId?: number | null,
  projectManagerId?: number | null
): boolean {
  if (role === 'admin') {
    return true
  }

  if (role === 'manager' && projectManagerId === userId) {
    return true
  }

  if (role === 'member' && taskAssigneeId === userId) {
    return true // Members can update their own tasks
  }

  return false
}

/**
 * Check if user can approve expenses
 */
export function canApproveExpense(role: UserRole | string): boolean {
  return can(role, 'canApproveExpenses')
}

/**
 * Check if user can manage finance documents (SO/PO/Invoices/Bills)
 */
export function canManageFinanceDocuments(role: UserRole | string): boolean {
  return role === 'admin' || role === 'manager' || role === 'finance'
}

/**
 * Get allowed roles for invitations based on inviter's role
 */
export function getAllowedInvitationRoles(inviterRole: UserRole | string): string[] {
  switch (inviterRole) {
    case 'admin':
      return ['admin', 'manager', 'member', 'finance']
    case 'manager':
      return ['member'] // Managers can only invite members
    case 'finance':
      return ['finance'] // Finance can only invite other finance people
    default:
      return []
  }
}
