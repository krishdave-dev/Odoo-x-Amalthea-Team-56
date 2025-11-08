import type { UserRole } from '@/types/enums'

/**
 * Role-based permission system
 * 
 * Role Permissions:
 * - Admin: Everything (full access)
 * - Manager (Project Manager): Create/edit projects, assign people, manage tasks, approve expenses, trigger invoices
 * - Finance (Sales/Finance): Create/link SO/PO/Customer Invoices/Vendor Bills/Expenses in projects
 * - Member (Team Member): View assigned tasks, update status, log hours, submit expenses
 */

export interface PermissionCheck {
  // Project permissions
  canCreateProjects: boolean
  canEditProjects: boolean
  canDeleteProjects: boolean
  canViewAllProjects: boolean
  canAssignProjectMembers: boolean
  
  // Task permissions
  canCreateTasks: boolean
  canManageTasks: boolean
  canViewAllTasks: boolean
  canUpdateOwnTasks: boolean
  
  // Finance permissions
  canManageFinance: boolean // SO/PO/Invoices/Bills
  canCreateExpenses: boolean
  canApproveExpenses: boolean
  canTriggerInvoices: boolean
  
  // Timesheet permissions
  canLogHours: boolean
  canViewAllTimesheets: boolean
  
  // User/Org permissions
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
      // Admin: Everything
      return {
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: true,
        canViewAllProjects: true,
        canAssignProjectMembers: true,
        canCreateTasks: true,
        canManageTasks: true,
        canViewAllTasks: true,
        canUpdateOwnTasks: true,
        canManageFinance: true,
        canCreateExpenses: true,
        canApproveExpenses: true,
        canTriggerInvoices: true,
        canLogHours: true,
        canViewAllTimesheets: true,
        canManageUsers: true,
        canManageOrganization: true,
        canInviteUsers: true,
        canCreateOrganization: true,
      }

    case 'manager':
      // Project Manager: Create/edit projects, assign people, manage tasks, approve expenses, trigger invoices
      return {
        canCreateProjects: true,
        canEditProjects: true, // Can edit their own projects
        canDeleteProjects: false, // Only admin can delete
        canViewAllProjects: true,
        canAssignProjectMembers: true, // Assign people to projects
        canCreateTasks: true,
        canManageTasks: true, // Manage all tasks in their projects
        canViewAllTasks: true,
        canUpdateOwnTasks: true,
        canManageFinance: false, // Cannot directly manage finance docs
        canCreateExpenses: true,
        canApproveExpenses: true, // Approve expenses
        canTriggerInvoices: true, // Trigger invoices
        canLogHours: true,
        canViewAllTimesheets: true,
        canManageUsers: false,
        canManageOrganization: false,
        canInviteUsers: true,
        canCreateOrganization: false,
      }

    case 'finance':
      // Sales/Finance: Create/link SO/PO/Customer Invoices/Vendor Bills/Expenses in projects
      return {
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canViewAllProjects: true, // View projects to link finance docs
        canAssignProjectMembers: false,
        canCreateTasks: false,
        canManageTasks: false,
        canViewAllTasks: true, // View tasks for expense tracking
        canUpdateOwnTasks: false,
        canManageFinance: true, // Create/link SO/PO/Invoices/Bills/Expenses
        canCreateExpenses: true,
        canApproveExpenses: false, // Finance creates but doesn't approve
        canTriggerInvoices: false, // Managers trigger invoices
        canLogHours: false,
        canViewAllTimesheets: true, // View for billing purposes
        canManageUsers: false,
        canManageOrganization: false,
        canInviteUsers: false,
        canCreateOrganization: false,
      }

    case 'member':
      // Team Member: View assigned tasks, update status, log hours, submit expenses
      return {
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canViewAllProjects: false, // Only see assigned projects
        canAssignProjectMembers: false,
        canCreateTasks: false,
        canManageTasks: false,
        canViewAllTasks: false, // Only see assigned tasks
        canUpdateOwnTasks: true, // Update assigned tasks
        canManageFinance: false,
        canCreateExpenses: true, // Submit expenses
        canApproveExpenses: false,
        canTriggerInvoices: false,
        canLogHours: true, // Log hours on tasks
        canViewAllTimesheets: false, // Only see own timesheets
        canManageUsers: false,
        canManageOrganization: false,
        canInviteUsers: false,
        canCreateOrganization: false,
      }

    default:
      // Default to most restrictive permissions
      return {
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canViewAllProjects: false,
        canAssignProjectMembers: false,
        canCreateTasks: false,
        canManageTasks: false,
        canViewAllTasks: false,
        canUpdateOwnTasks: false,
        canManageFinance: false,
        canCreateExpenses: false,
        canApproveExpenses: false,
        canTriggerInvoices: false,
        canLogHours: false,
        canViewAllTimesheets: false,
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
  return can(role, 'canManageFinance')
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
