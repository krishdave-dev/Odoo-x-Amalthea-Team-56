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
  
  // Financial document events
  SALES_ORDER_CREATED = 'SALES_ORDER_CREATED',
  SALES_ORDER_UPDATED = 'SALES_ORDER_UPDATED',
  SALES_ORDER_CONFIRMED = 'SALES_ORDER_CONFIRMED',
  SALES_ORDER_INVOICED = 'SALES_ORDER_INVOICED',
  SALES_ORDER_CANCELLED = 'SALES_ORDER_CANCELLED',
  SALES_ORDER_DELETED = 'SALES_ORDER_DELETED',
  
  PURCHASE_ORDER_CREATED = 'PURCHASE_ORDER_CREATED',
  PURCHASE_ORDER_UPDATED = 'PURCHASE_ORDER_UPDATED',
  PURCHASE_ORDER_CONFIRMED = 'PURCHASE_ORDER_CONFIRMED',
  PURCHASE_ORDER_BILLED = 'PURCHASE_ORDER_BILLED',
  PURCHASE_ORDER_CANCELLED = 'PURCHASE_ORDER_CANCELLED',
  PURCHASE_ORDER_DELETED = 'PURCHASE_ORDER_DELETED',
  
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_UPDATED = 'INVOICE_UPDATED',
  INVOICE_SENT = 'INVOICE_SENT',
  INVOICE_PAID = 'INVOICE_PAID',
  INVOICE_CANCELLED = 'INVOICE_CANCELLED',
  INVOICE_LINKED_TO_SO = 'INVOICE_LINKED_TO_SO',
  INVOICE_DELETED = 'INVOICE_DELETED',
  
  BILL_CREATED = 'BILL_CREATED',
  BILL_UPDATED = 'BILL_UPDATED',
  BILL_RECEIVED = 'BILL_RECEIVED',
  BILL_PAID = 'BILL_PAID',
  BILL_CANCELLED = 'BILL_CANCELLED',
  BILL_LINKED_TO_PO = 'BILL_LINKED_TO_PO',
  BILL_DELETED = 'BILL_DELETED',
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
  SALES_ORDER = 'sales_order',
  PURCHASE_ORDER = 'purchase_order',
  INVOICE = 'customer_invoice',
  BILL = 'vendor_bill',
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

  /**
   * Get events with pagination (for admin dashboard)
   */
  async getEventsPaginated(
    organizationId: number,
    filters?: {
      entityType?: string
      entityId?: number
      eventType?: string
      fromDate?: Date
      toDate?: Date
      userId?: number
      page?: number
      pageSize?: number
    }
  ) {
    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 50

    const where: any = { organizationId }

    if (filters?.entityType) where.entityType = filters.entityType
    if (filters?.entityId !== undefined) where.entityId = filters.entityId
    if (filters?.eventType) where.eventType = filters.eventType

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {}
      if (filters.fromDate) where.createdAt.gte = filters.fromDate
      if (filters.toDate) where.createdAt.lte = filters.toDate
    }

    // Filter by userId in payload (JSON path query)
    if (filters?.userId !== undefined) {
      where.payload = {
        path: ['userId'],
        equals: filters.userId,
      }
    }

    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      events,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  /**
   * Get single event by ID
   */
  async getEventById(eventId: number, organizationId: number) {
    return prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId,
      },
    })
  }

  /**
   * Get event summary for admin dashboard
   */
  async getEventSummary(organizationId: number) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const [
      totalEvents,
      eventsToday,
      eventsThisWeek,
      eventsThisMonth,
      entityGroups,
      eventTypeGroups,
    ] = await Promise.all([
      prisma.event.count({ where: { organizationId } }),
      prisma.event.count({ where: { organizationId, createdAt: { gte: today } } }),
      prisma.event.count({ where: { organizationId, createdAt: { gte: weekAgo } } }),
      prisma.event.count({ where: { organizationId, createdAt: { gte: monthAgo } } }),
      prisma.event.groupBy({
        by: ['entityType'],
        where: { organizationId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.event.groupBy({
        by: ['eventType'],
        where: { organizationId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ])

    // Activity trend (last 14 days)
    const twoWeeksAgo = new Date(today)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const recentEvents = await prisma.event.findMany({
      where: {
        organizationId,
        createdAt: { gte: twoWeeksAgo },
      },
      select: { createdAt: true },
    })

    // Group by date
    const dailyCounts = new Map<string, number>()
    recentEvents.forEach(e => {
      const date = e.createdAt.toISOString().substring(0, 10)
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1)
    })

    const trend = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      summary: {
        totalEvents,
        eventsToday,
        eventsThisWeek,
        eventsThisMonth,
      },
      topEntities: entityGroups.map(g => ({
        entityType: g.entityType,
        count: g._count.id,
      })),
      topEventTypes: eventTypeGroups.map(g => ({
        eventType: g.eventType,
        count: g._count.id,
      })),
      trend,
    }
  }

  /**
   * Get events for export (capped at 10k records)
   */
  async getEventsForExport(
    organizationId: number,
    filters?: {
      entityType?: string
      entityId?: number
      eventType?: string
      fromDate?: Date
      toDate?: Date
    }
  ) {
    const where: any = { organizationId }

    if (filters?.entityType) where.entityType = filters.entityType
    if (filters?.entityId !== undefined) where.entityId = filters.entityId
    if (filters?.eventType) where.eventType = filters.eventType

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {}
      if (filters.fromDate) where.createdAt.gte = filters.fromDate
      if (filters.toDate) where.createdAt.lte = filters.toDate
    }

    // Limit to 10,000 records to prevent OOM
    return prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })
  }

  /**
   * Delete old events (for cleanup jobs)
   */
  async deleteOldEvents(organizationId: number, olderThan: Date) {
    const result = await prisma.event.deleteMany({
      where: {
        organizationId,
        createdAt: { lt: olderThan },
      },
    })
    return result.count
  }
}

// Export singleton instance
export const eventService = new EventService()
