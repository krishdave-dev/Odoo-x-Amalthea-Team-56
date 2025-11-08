import { z } from 'zod'

/**
 * Validation utilities
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
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
export const uuidSchema = z.string().uuid()
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
  organizationId: uuidSchema,
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
  organizationId: uuidSchema,
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  projectManagerId: uuidSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: positiveDecimalSchema.optional(),
  status: z.string().default('planned'),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  projectManagerId: uuidSchema.nullable().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: positiveDecimalSchema.optional(),
  status: z.string().optional(),
  progressPct: z.coerce.number().min(0).max(100).optional(),
  version: z.number().int().optional(),
})

// Project Member schemas
export const createProjectMemberSchema = z.object({
  userId: uuidSchema,
  roleInProject: z.string().optional(),
})

export const updateProjectMemberSchema = z.object({
  roleInProject: z.string().optional(),
})

// Task List schemas
export const createTaskListSchema = z.object({
  projectId: uuidSchema,
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
  projectId: uuidSchema,
  listId: uuidSchema.optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  assigneeId: uuidSchema.optional(),
  priority: taskPrioritySchema.default(2),
  status: taskStatusEnum.default('new'),
  estimateHours: positiveDecimalSchema.optional(),
  dueDate: z.coerce.date().optional(),
  metadata: z.record(z.any()).optional(),
})

export const updateTaskSchema = z.object({
  listId: uuidSchema.optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  assigneeId: uuidSchema.nullable().optional(),
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
  managerId: uuidSchema.optional(),
  includeProjects: z.coerce.boolean().optional(),
})

export const userQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  role: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

export const taskQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  projectId: uuidSchema.optional(),
  assigneeId: uuidSchema.optional(),
  status: taskStatusEnum.optional(),
  priority: taskPrioritySchema.optional(),
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
