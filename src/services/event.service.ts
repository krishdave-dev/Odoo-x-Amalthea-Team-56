import { prisma } from '@/lib/prisma'

/**
 * Event types for audit logging
 */
export enum EventType {
  // Expense events
  EXPENSE_CREATED = 'EXPENSE_CREATED',
  EXPENSE_UPDATED = 'EXPENSE_UPDATED',
  EXPENSE_SUBMITTED = 'EXPENSE_SUBMITTED',
  EXPENSE_APPROVED = 'EXPENSE_APPROVED',
  EXPENSE_REJECTED = 'EXPENSE_REJECTED',
  EXPENSE_PAID = 'EXPENSE_PAID',
  EXPENSE_DELETED = 'EXPENSE_DELETED',
  
  // Project events
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  
  // Task events
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  
  // User events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
}

/**
 * Entity types for audit logging
 */
export enum EntityType {
  EXPENSE = 'expense',
  PROJECT = 'project',
  TASK = 'task',
  USER = 'user',
  ORGANIZATION = 'organization',
  TIMESHEET = 'timesheet',
}

/**
 * EventService - Centralized audit logging
 * All state changes should be logged through this service for traceability
 */
export class EventService {
  /**
   * Log an event to the audit trail
   */
  async logEvent(
    organizationId: number,
    entityType: EntityType | string,
    entityId: number | null,
    eventType: EventType | string,
    payload?: Record<string, any>
  ) {
    try {
      return await prisma.event.create({
        data: {
          organizationId,
          entityType,
          entityId,
          eventType,
          payload: payload || {},
        },
      })
    } catch (error) {
      console.error('Failed to log event:', error)
      // Don't throw - logging failures shouldn't break the main operation
      return null
    }
  }

  /**
   * Log expense created event
   */
  async logExpenseCreated(
    organizationId: number,
    expenseId: number,
    data: {
      amount: number
      userId?: number
      projectId?: number
      billable: boolean
    }
  ) {
    return this.logEvent(
      organizationId,
      EntityType.EXPENSE,
      expenseId,
      EventType.EXPENSE_CREATED,
      {
        expenseId,
        amount: data.amount.toString(),
        userId: data.userId,
        projectId: data.projectId,
        billable: data.billable,
        timestamp: new Date().toISOString(),
      }
    )
  }

  /**
   * Log expense updated event
   */
  async logExpenseUpdated(
    organizationId: number,
    expenseId: number,
    changes: Record<string, any>
  ) {
    return this.logEvent(
      organizationId,
      EntityType.EXPENSE,
      expenseId,
      EventType.EXPENSE_UPDATED,
      {
        expenseId,
        changes,
        timestamp: new Date().toISOString(),
      }
    )
  }

  /**
   * Log expense submitted event
   */
  async logExpenseSubmitted(
    organizationId: number,
    expenseId: number,
    data: {
      userId: number
      amount: number
      projectId?: number
    }
  ) {
    return this.logEvent(
      organizationId,
      EntityType.EXPENSE,
      expenseId,
      EventType.EXPENSE_SUBMITTED,
      {
        expenseId,
        submittedBy: data.userId,
        amount: data.amount.toString(),
        projectId: data.projectId,
        timestamp: new Date().toISOString(),
      }
    )
  }

  /**
   * Log expense approved event
   */
  async logExpenseApproved(
    organizationId: number,
    expenseId: number,
    data: {
      approvedBy: number
      amount: number
      userId?: number
    }
  ) {
    return this.logEvent(
      organizationId,
      EntityType.EXPENSE,
      expenseId,
      EventType.EXPENSE_APPROVED,
      {
        expenseId,
        approvedBy: data.approvedBy,
        amount: data.amount.toString(),
        userId: data.userId,
        timestamp: new Date().toISOString(),
      }
    )
  }

  /**
   * Log expense rejected event
   */
  async logExpenseRejected(
    organizationId: number,
    expenseId: number,
    data: {
      rejectedBy: number
      reason?: string
      amount: number
    }
  ) {
    return this.logEvent(
      organizationId,
      EntityType.EXPENSE,
      expenseId,
      EventType.EXPENSE_REJECTED,
      {
        expenseId,
        rejectedBy: data.rejectedBy,
        reason: data.reason,
        amount: data.amount.toString(),
        timestamp: new Date().toISOString(),
      }
    )
  }

  /**
   * Log expense paid event
   */
  async logExpensePaid(
    organizationId: number,
    expenseId: number,
    data: {
      paidBy: number
      amount: number
      userId?: number
    }
  ) {
    return this.logEvent(
      organizationId,
      EntityType.EXPENSE,
      expenseId,
      EventType.EXPENSE_PAID,
      {
        expenseId,
        paidBy: data.paidBy,
        amount: data.amount.toString(),
        userId: data.userId,
        timestamp: new Date().toISOString(),
      }
    )
  }

  /**
   * Log expense deleted event
   */
  async logExpenseDeleted(
    organizationId: number,
    expenseId: number,
    data: {
      deletedBy: number
      amount: number
    }
  ) {
    return this.logEvent(
      organizationId,
      EntityType.EXPENSE,
      expenseId,
      EventType.EXPENSE_DELETED,
      {
        expenseId,
        deletedBy: data.deletedBy,
        amount: data.amount.toString(),
        timestamp: new Date().toISOString(),
      }
    )
  }

  /**
   * Get events for an entity
   */
  async getEventsForEntity(
    entityType: EntityType | string,
    entityId: number,
    limit: number = 50
  ) {
    return prisma.event.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
  }

  /**
   * Get events for an organization
   */
  async getEventsForOrganization(
    organizationId: number,
    filters?: {
      entityType?: string
      eventType?: string
      startDate?: Date
      endDate?: Date
    },
    limit: number = 100
  ) {
    return prisma.event.findMany({
      where: {
        organizationId,
        ...(filters?.entityType && { entityType: filters.entityType }),
        ...(filters?.eventType && { eventType: filters.eventType }),
        ...(filters?.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters?.endDate && { createdAt: { lte: filters.endDate } }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
  }
}

// Export singleton instance
export const eventService = new EventService()
