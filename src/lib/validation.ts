import { z } from 'zod'

/**
 * Validation utilities
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0
}

export function validateCurrency(currency: string): boolean {
  // ISO 4217 currency codes are 3 letters
  return /^[A-Z]{3}$/.test(currency)
}

export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch (error) {
    return false
  }
}

export function validatePositiveNumber(value: number): boolean {
  return typeof value === 'number' && value >= 0 && !isNaN(value)
}

export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate <= endDate
}

/**
 * Zod Schema Validators
 */

// Common schemas
export const idSchema = z.coerce.number().int().positive()
export const emailSchema = z.string().email()
export const positiveNumberSchema = z.number().nonnegative()
export const positiveDecimalSchema = z.coerce.number().nonnegative()

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
})

// Organization schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  currency: z.string().length(3).toUpperCase().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  timezone: z.string().optional(),
})

// User schemas
export const createUserSchema = z.object({
  organizationId: idSchema,
  email: emailSchema,
  name: z.string().min(1).max(255).optional(),
  passwordHash: z.string().optional(),
  role: z.string().min(1),
  hourlyRate: positiveDecimalSchema.default(0),
  isActive: z.boolean().default(true),
})

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  name: z.string().min(1).max(255).optional(),
  role: z.string().min(1).optional(),
  hourlyRate: positiveDecimalSchema.optional(),
  isActive: z.boolean().optional(),
})

// Project schemas
export const createProjectSchema = z.object({
  organizationId: idSchema.optional(), // Optional - will use authenticated user's org
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  projectManagerId: idSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: positiveDecimalSchema.optional(),
  status: z.string().default('planned'),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  projectManagerId: idSchema.nullable().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: positiveDecimalSchema.optional(),
  status: z.string().optional(),
  progressPct: z.coerce.number().min(0).max(100).optional(),
  version: z.number().int().optional(),
})

// Project Member schemas
export const createProjectMemberSchema = z.object({
  userId: idSchema,
  roleInProject: z.string().optional(),
})

export const updateProjectMemberSchema = z.object({
  roleInProject: z.string().optional(),
})

// Task List schemas
export const createTaskListSchema = z.object({
  projectId: idSchema,
  title: z.string().min(1).max(255),
  ordinal: z.number().int().default(0),
})

export const updateTaskListSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  ordinal: z.number().int().optional(),
})

// Task schemas
export const taskStatusEnum = z.enum(['new', 'in_progress', 'in_review', 'completed', 'blocked'])
export const taskPrioritySchema = z.coerce.number().int().min(1).max(4)

export const createTaskSchema = z.object({
  projectId: idSchema,
  listId: idSchema.optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  assigneeId: idSchema.optional(),
  priority: taskPrioritySchema.default(2),
  status: taskStatusEnum.default('new'),
  estimateHours: positiveDecimalSchema.optional(),
  dueDate: z.coerce.date().optional(),
  metadata: z.record(z.any()).optional(),
})

export const updateTaskSchema = z.object({
  listId: idSchema.optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  assigneeId: idSchema.nullable().optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusEnum.optional(),
  estimateHours: positiveDecimalSchema.optional(),
  dueDate: z.coerce.date().nullable().optional(),
  metadata: z.record(z.any()).optional(),
  version: z.number().int().optional(),
})

// Query param schemas
export const projectQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  status: z.string().optional(),
  managerId: idSchema.optional(),
  includeProjects: z.coerce.boolean().optional(),
})

export const userQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  role: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

export const taskQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  projectId: idSchema.optional(),
  assigneeId: idSchema.optional(),
  status: taskStatusEnum.optional(),
  priority: taskPrioritySchema.optional(),
})

// Expense schemas
export const expenseStatusEnum = z.enum(['draft', 'submitted', 'approved', 'rejected', 'paid'])

export const createExpenseSchema = z.object({
  organizationId: idSchema,
  projectId: idSchema.optional(),
  userId: idSchema.optional(),
  amount: z.coerce.number().positive(),
  billable: z.boolean().default(false),
  note: z.string().max(1000).optional(),
  receiptUrl: z.string().url().optional(),
})

export const updateExpenseSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  billable: z.boolean().optional(),
  note: z.string().max(1000).optional(),
  receiptUrl: z.string().url().optional(),
})

export const expenseWorkflowSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const expenseQuerySchema = paginationSchema.extend({
  status: expenseStatusEnum.optional(),
  userId: idSchema.optional(),
  projectId: idSchema.optional(),
  billable: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
})

// Financial Document schemas
// Sales Order schemas
export const salesOrderStatusEnum = z.enum(['draft', 'confirmed', 'invoiced', 'cancelled'])

export const createSalesOrderSchema = z.object({
  organizationId: idSchema,
  projectId: idSchema.optional(),
  soNumber: z.string().min(1).max(100),
  partnerName: z.string().min(1).max(255).optional(),
  orderDate: z.coerce.date().optional(),
  totalAmount: z.coerce.number().nonnegative().default(0),
  status: salesOrderStatusEnum.default('draft'),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const updateSalesOrderSchema = z.object({
  soNumber: z.string().min(1).max(100).optional(),
  partnerName: z.string().min(1).max(255).optional(),
  orderDate: z.coerce.date().optional(),
  totalAmount: z.coerce.number().nonnegative().optional(),
  status: salesOrderStatusEnum.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const salesOrderQuerySchema = paginationSchema.extend({
  status: salesOrderStatusEnum.optional(),
  projectId: idSchema.optional(),
  partnerName: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// Purchase Order schemas
export const purchaseOrderStatusEnum = z.enum(['draft', 'confirmed', 'billed', 'cancelled'])

export const createPurchaseOrderSchema = z.object({
  organizationId: idSchema,
  projectId: idSchema.optional(),
  poNumber: z.string().min(1).max(100),
  vendorName: z.string().min(1).max(255).optional(),
  orderDate: z.coerce.date().optional(),
  totalAmount: z.coerce.number().nonnegative().default(0),
  status: purchaseOrderStatusEnum.default('draft'),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const updatePurchaseOrderSchema = z.object({
  poNumber: z.string().min(1).max(100).optional(),
  vendorName: z.string().min(1).max(255).optional(),
  orderDate: z.coerce.date().optional(),
  totalAmount: z.coerce.number().nonnegative().optional(),
  status: purchaseOrderStatusEnum.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const purchaseOrderQuerySchema = paginationSchema.extend({
  status: purchaseOrderStatusEnum.optional(),
  projectId: idSchema.optional(),
  vendorName: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// Customer Invoice schemas
export const invoiceStatusEnum = z.enum(['draft', 'sent', 'paid', 'cancelled'])

export const createInvoiceSchema = z.object({
  organizationId: idSchema,
  projectId: idSchema.optional(),
  soId: idSchema.optional(),
  invoiceNumber: z.string().min(1).max(100),
  invoiceDate: z.coerce.date().optional(),
  amount: z.coerce.number().positive(),
  status: invoiceStatusEnum.default('draft'),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(100).optional(),
  invoiceDate: z.coerce.date().optional(),
  amount: z.coerce.number().positive().optional(),
  status: invoiceStatusEnum.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const invoiceQuerySchema = paginationSchema.extend({
  status: invoiceStatusEnum.optional(),
  projectId: idSchema.optional(),
  soId: idSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// Vendor Bill schemas
export const billStatusEnum = z.enum(['draft', 'received', 'paid', 'cancelled'])

export const createBillSchema = z.object({
  organizationId: idSchema,
  projectId: idSchema.optional(),
  poId: idSchema.optional(),
  vendorName: z.string().min(1).max(255).optional(),
  billDate: z.coerce.date().optional(),
  amount: z.coerce.number().positive(),
  status: billStatusEnum.default('draft'),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const updateBillSchema = z.object({
  vendorName: z.string().min(1).max(255).optional(),
  billDate: z.coerce.date().optional(),
  amount: z.coerce.number().positive().optional(),
  status: billStatusEnum.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const billQuerySchema = paginationSchema.extend({
  status: billStatusEnum.optional(),
  projectId: idSchema.optional(),
  poId: idSchema.optional(),
  vendorName: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

/**
 * Helper to parse and validate request body
 */
export async function parseBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await req.json()
  return schema.parse(body)
}

/**
 * Helper to parse and validate query params
 */
export function parseQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params = Object.fromEntries(searchParams.entries())
  return schema.parse(params)
}
