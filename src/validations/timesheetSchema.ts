import { z } from 'zod'

/**
 * Timesheet validation schemas
 */

// Base timesheet schema for creation
export const createTimesheetSchema = z.object({
  taskId: z.string().uuid({ message: 'Invalid task ID' }),
  userId: z.string().uuid({ message: 'Invalid user ID' }),
  start: z.string().datetime({ message: 'Invalid start datetime' }),
  end: z.string().datetime({ message: 'Invalid end datetime' }),
  billable: z.boolean().default(true),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const startDate = new Date(data.start)
    const endDate = new Date(data.end)
    return startDate < endDate
  },
  {
    message: 'Start time must be before end time',
    path: ['end'],
  }
)

// Schema for updating a timesheet
export const updateTimesheetSchema = z.object({
  taskId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  billable: z.boolean().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // If both start and end are provided, validate they're in correct order
    if (data.start && data.end) {
      const startDate = new Date(data.start)
      const endDate = new Date(data.end)
      return startDate < endDate
    }
    return true
  },
  {
    message: 'Start time must be before end time',
    path: ['end'],
  }
)

// Schema for bulk timesheet creation
export const bulkTimesheetSchema = z.object({
  entries: z.array(createTimesheetSchema).min(1, 'At least one entry is required'),
})

// Schema for status update
export const updateTimesheetStatusSchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'locked'], {
    errorMap: () => ({ message: 'Status must be draft, submitted, approved, or locked' }),
  }),
})

// Timesheet status enum
export const TIMESHEET_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  LOCKED: 'locked',
} as const

export type TimesheetStatus = typeof TIMESHEET_STATUSES[keyof typeof TIMESHEET_STATUSES]

// Type exports
export type CreateTimesheetInput = z.infer<typeof createTimesheetSchema>
export type UpdateTimesheetInput = z.infer<typeof updateTimesheetSchema>
export type BulkTimesheetInput = z.infer<typeof bulkTimesheetSchema>
export type UpdateTimesheetStatusInput = z.infer<typeof updateTimesheetStatusSchema>

/**
 * Validate status transition
 */
export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const transitions: Record<string, string[]> = {
    draft: ['submitted'],
    submitted: ['approved'],
    approved: ['locked'],
    locked: [], // No transitions allowed from locked
  }

  return transitions[currentStatus]?.includes(newStatus) ?? false
}
