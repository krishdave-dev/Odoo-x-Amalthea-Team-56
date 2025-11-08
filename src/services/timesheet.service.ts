import { prisma } from '@/lib/prisma'
import { createAuditEvent } from '@/lib/db-helpers'
import type { Timesheet } from '@prisma/client'
import type { PaginatedResponse } from '@/types/common'
import type {
  CreateTimesheetInput,
  UpdateTimesheetInput,
  TimesheetStatus,
} from '@/validations/timesheetSchema'
import { isValidStatusTransition } from '@/validations/timesheetSchema'

/**
 * Filter options for timesheets
 */
export interface TimesheetFilters {
  projectId?: string
  taskId?: string
  userId?: string
  billable?: boolean
  status?: string
  from?: string // ISO date string
  to?: string // ISO date string
}

/**
 * Timesheet Service - handles business logic for timesheets
 */
export class TimesheetService {
  /**
   * Calculate duration in hours between two dates
   */
  private calculateDuration(start: Date, end: Date): number {
    return (end.getTime() - start.getTime()) / 3600000
  }

  /**
   * Get all timesheets with filtering and pagination
   */
  async getTimesheets(
    filters: TimesheetFilters,
    page: number = 1,
    pageSize: number = 20,
    sort: string = 'createdAt:desc'
  ): Promise<PaginatedResponse<Timesheet>> {
    const skip = (page - 1) * pageSize
    const take = pageSize

    // Build where clause
    const where: any = {
      deletedAt: null,
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.taskId && { taskId: filters.taskId }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.billable !== undefined && { billable: filters.billable }),
      ...(filters.status && { status: filters.status }),
    }

    // Handle date range filtering
    if (filters.from || filters.to) {
      where.start = {}
      if (filters.from) {
        where.start.gte = new Date(filters.from)
      }
      if (filters.to) {
        where.start.lte = new Date(filters.to)
      }
    }

    // Parse sort parameter
    const [sortField, sortOrder] = sort.split(':')
    const orderBy = { [sortField || 'createdAt']: sortOrder || 'desc' }

    // Fetch data with pagination
    const [data, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              hourlyRate: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy,
      }),
      prisma.timesheet.count({ where }),
    ])

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Get a single timesheet by ID
   */
  async getTimesheetById(id: string): Promise<Timesheet | null> {
    return prisma.timesheet.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            projectId: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })
  }

  /**
   * Create a new timesheet entry
   */
  async createTimesheet(input: CreateTimesheetInput): Promise<Timesheet> {
    return await prisma.$transaction(async (tx) => {
      // Fetch user's hourly rate
      const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { hourlyRate: true, organizationId: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Fetch task to get projectId
      const task = await tx.task.findUnique({
        where: { id: input.taskId },
        select: { projectId: true },
      })

      if (!task) {
        throw new Error('Task not found')
      }

      // Calculate duration and cost
      const startDate = new Date(input.start)
      const endDate = new Date(input.end)
      const durationHours = this.calculateDuration(startDate, endDate)
      const costAtTime = Number(user.hourlyRate) * durationHours

      // Create timesheet
      const timesheet = await tx.timesheet.create({
        data: {
          userId: input.userId,
          taskId: input.taskId,
          projectId: task.projectId,
          start: startDate,
          end: endDate,
          durationHours,
          billable: input.billable,
          notes: input.notes,
          costAtTime,
          status: 'draft',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              hourlyRate: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      })

      // Create audit event
      await createAuditEvent(
        user.organizationId,
        'timesheet',
        timesheet.id,
        'timesheet.created',
        {
          timesheetId: timesheet.id,
          userId: input.userId,
          taskId: input.taskId,
          durationHours,
        }
      )

      return timesheet
    })
  }

  /**
   * Update a timesheet entry
   */
  async updateTimesheet(id: string, input: UpdateTimesheetInput): Promise<Timesheet> {
    return await prisma.$transaction(async (tx) => {
      // Check if timesheet exists
      const existing = await tx.timesheet.findUnique({
        where: { id },
        include: {
          user: { select: { hourlyRate: true, organizationId: true } },
        },
      })

      if (!existing) {
        throw new Error('Timesheet not found')
      }

      if (existing.deletedAt) {
        throw new Error('Cannot update deleted timesheet')
      }

      // Check if status allows editing
      if (existing.status === 'locked' || existing.status === 'approved') {
        throw new Error(
          `Cannot edit timesheet with status: ${existing.status}. Only draft and submitted timesheets can be edited.`
        )
      }

      // Prepare update data
      const updateData: any = {}

      // If start or end is updated, recalculate duration and cost
      if (input.start || input.end) {
        const startDate = input.start ? new Date(input.start) : existing.start
        const endDate = input.end ? new Date(input.end) : existing.end

        updateData.start = startDate
        updateData.end = endDate
        updateData.durationHours = this.calculateDuration(startDate, endDate)
        updateData.costAtTime = Number(existing.user.hourlyRate) * updateData.durationHours
      }

      // Update other fields
      if (input.taskId !== undefined) {
        // Fetch new task to update projectId
        const task = await tx.task.findUnique({
          where: { id: input.taskId },
          select: { projectId: true },
        })
        if (!task) {
          throw new Error('Task not found')
        }
        updateData.taskId = input.taskId
        updateData.projectId = task.projectId
      }

      if (input.userId !== undefined) {
        // Fetch new user's hourly rate
        const user = await tx.user.findUnique({
          where: { id: input.userId },
          select: { hourlyRate: true },
        })
        if (!user) {
          throw new Error('User not found')
        }
        updateData.userId = input.userId

        // Recalculate cost if user changed
        if (updateData.durationHours !== undefined) {
          updateData.costAtTime = Number(user.hourlyRate) * updateData.durationHours
        }
      }

      if (input.billable !== undefined) updateData.billable = input.billable
      if (input.notes !== undefined) updateData.notes = input.notes

      // Update timesheet
      const timesheet = await tx.timesheet.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              hourlyRate: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      })

      // Create audit event
      await createAuditEvent(
        existing.user.organizationId,
        'timesheet',
        id,
        'timesheet.updated',
        {
          timesheetId: id,
          changes: input,
        }
      )

      return timesheet
    })
  }

  /**
   * Delete a timesheet (soft delete)
   */
  async deleteTimesheet(id: string): Promise<boolean> {
    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        user: { select: { organizationId: true } },
      },
    })

    if (!timesheet) {
      throw new Error('Timesheet not found')
    }

    if (timesheet.deletedAt) {
      throw new Error('Timesheet already deleted')
    }

    if (timesheet.status === 'locked') {
      throw new Error('Cannot delete locked timesheet')
    }

    await prisma.$transaction(async (tx) => {
      await tx.timesheet.update({
        where: { id },
        data: { deletedAt: new Date() },
      })

      await createAuditEvent(
        timesheet.user.organizationId,
        'timesheet',
        id,
        'timesheet.deleted',
        { timesheetId: id }
      )
    })

    return true
  }

  /**
   * Bulk create timesheets
   */
  async bulkCreateTimesheets(entries: CreateTimesheetInput[]): Promise<{
    inserted: number
    failed: number
    errors: Array<{ index: number; error: string }>
  }> {
    let inserted = 0
    let failed = 0
    const errors: Array<{ index: number; error: string }> = []

    for (let i = 0; i < entries.length; i++) {
      try {
        await this.createTimesheet(entries[i])
        inserted++
      } catch (error) {
        failed++
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return { inserted, failed, errors }
  }

  /**
   * Update timesheet status
   */
  async updateTimesheetStatus(id: string, newStatus: TimesheetStatus): Promise<Timesheet> {
    return await prisma.$transaction(async (tx) => {
      const timesheet = await tx.timesheet.findUnique({
        where: { id },
        include: {
          user: { select: { organizationId: true } },
        },
      })

      if (!timesheet) {
        throw new Error('Timesheet not found')
      }

      if (timesheet.deletedAt) {
        throw new Error('Cannot update status of deleted timesheet')
      }

      // Validate status transition
      if (!isValidStatusTransition(timesheet.status, newStatus)) {
        throw new Error(
          `Invalid status transition from ${timesheet.status} to ${newStatus}. ` +
            `Allowed transitions: draft → submitted → approved → locked`
        )
      }

      // Update status
      const updated = await tx.timesheet.update({
        where: { id },
        data: { status: newStatus },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              hourlyRate: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      })

      // Create audit event
      await createAuditEvent(
        timesheet.user.organizationId,
        'timesheet',
        id,
        'timesheet.status_changed',
        {
          timesheetId: id,
          oldStatus: timesheet.status,
          newStatus,
        }
      )

      return updated
    })
  }
}

export const timesheetService = new TimesheetService()
