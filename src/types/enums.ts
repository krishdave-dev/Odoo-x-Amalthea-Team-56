/**
 * Project status types
 */
export const PROJECT_STATUSES = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type ProjectStatus = typeof PROJECT_STATUSES[keyof typeof PROJECT_STATUSES]

/**
 * Task status types
 */
export const TASK_STATUSES = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
} as const

export type TaskStatus = typeof TASK_STATUSES[keyof typeof TASK_STATUSES]

/**
 * Task priority types
 */
export const TASK_PRIORITIES = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
} as const

export type TaskPriority = typeof TASK_PRIORITIES[keyof typeof TASK_PRIORITIES]

/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
  FINANCE: 'finance',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

/**
 * Invitation status
 */
export const INVITATION_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const

export type InvitationStatus = typeof INVITATION_STATUSES[keyof typeof INVITATION_STATUSES]

/**
 * Invoice/Bill status
 */
export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const

export type InvoiceStatus = typeof INVOICE_STATUSES[keyof typeof INVOICE_STATUSES]

/**
 * Expense status
 */
export const EXPENSE_STATUSES = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
} as const

export type ExpenseStatus = typeof EXPENSE_STATUSES[keyof typeof EXPENSE_STATUSES]

/**
 * Attachment owner types
 */
export const ATTACHMENT_OWNER_TYPES = {
  TASK: 'task',
  EXPENSE: 'expense',
  INVOICE: 'invoice',
  BILL: 'bill',
  PROJECT: 'project',
} as const

export type AttachmentOwnerType = typeof ATTACHMENT_OWNER_TYPES[keyof typeof ATTACHMENT_OWNER_TYPES]

/**
 * Timesheet status
 */
export const TIMESHEET_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  LOCKED: 'locked',
} as const

export type TimesheetStatus = typeof TIMESHEET_STATUSES[keyof typeof TIMESHEET_STATUSES]
