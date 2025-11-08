/**
 * NotificationService - In-App Notification System
 * 
 * Features:
 * - Create notifications for users
 * - Fetch user notifications with filters
 * - Mark notifications as read
 * - Broadcast notifications to all organization users
 * - Integration with EventService for audit trail
 */

import { prisma } from '@/lib/prisma'

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_COMMENT'
  | 'EXPENSE_SUBMITTED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_REJECTED'
  | 'EXPENSE_PAID'
  | 'INVOICE_GENERATED'
  | 'INVOICE_SENT'
  | 'INVOICE_PAID'
  | 'BILL_RECEIVED'
  | 'BILL_PAID'
  | 'PROJECT_CREATED'
  | 'PROJECT_COMPLETED'
  | 'REPORT_READY'
  | 'SYSTEM_ALERT'
  | 'CUSTOM'

export interface CreateNotificationParams {
  orgId: number
  userId?: number // If null, it's a broadcast to all org users
  type: NotificationType | string
  title: string
  message: string
  data?: Record<string, any>
}

export interface NotificationFilters {
  userId: number
  unreadOnly?: boolean
  type?: string
  limit?: number
  offset?: number
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(params: CreateNotificationParams): Promise<void> {
    try {
      const { orgId, userId, type, title, message, data } = params

      await prisma.notification.create({
        data: {
          organizationId: orgId,
          userId,
          type,
          title,
          message,
          data: data || {},
        },
      })

      console.log(`[Notification] Created ${type} for user ${userId || 'ALL'} in org ${orgId}`)
    } catch (error) {
      console.error('[NotificationService] Failed to create notification:', error)
      // Don't throw - notification failures shouldn't break business logic
    }
  }

  /**
   * Create broadcast notification for all users in organization
   */
  static async broadcastToOrganization(
    orgId: number,
    type: NotificationType | string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Get all active users in organization
      const users = await prisma.user.findMany({
        where: {
          organizationId: orgId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      })

      // Create notification for each user
      const notifications = users.map(user => ({
        organizationId: orgId,
        userId: user.id,
        type,
        title,
        message,
        data: data || {},
        isRead: false,
      }))

      await prisma.notification.createMany({
        data: notifications,
      })

      console.log(`[Notification] Broadcast ${type} to ${users.length} users in org ${orgId}`)
    } catch (error) {
      console.error('[NotificationService] Failed to broadcast notification:', error)
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(filters: NotificationFilters) {
    const { userId, unreadOnly = false, type, limit = 50, offset = 0 } = filters

    const where: any = { userId }

    if (unreadOnly) {
      where.isRead = false
    }

    if (type) {
      where.type = type
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ])

    return {
      notifications,
      total,
      unreadCount,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId: number): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      })

      if (!notification) {
        return false
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })

      return true
    } catch (error) {
      console.error('[NotificationService] Failed to mark as read:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: number): Promise<number> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      })

      return result.count
    } catch (error) {
      console.error('[NotificationService] Failed to mark all as read:', error)
      return 0
    }
  }

  /**
   * Delete old read notifications (cleanup job)
   */
  static async deleteOldNotifications(olderThan: Date): Promise<number> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: {
            lt: olderThan,
          },
        },
      })

      console.log(`[NotificationService] Deleted ${result.count} old notifications`)
      return result.count
    } catch (error) {
      console.error('[NotificationService] Failed to delete old notifications:', error)
      return 0
    }
  }

  /**
   * Delete notification by ID
   */
  static async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      })

      if (!notification) {
        return false
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      })

      return true
    } catch (error) {
      console.error('[NotificationService] Failed to delete notification:', error)
      return false
    }
  }

  /**
   * Helper: Notify task assignment
   */
  static async notifyTaskAssigned(
    orgId: number,
    assigneeId: number,
    taskId: number,
    taskTitle: string,
    assignedBy?: string
  ) {
    await this.createNotification({
      orgId,
      userId: assigneeId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You have been assigned to: ${taskTitle}`,
      data: {
        taskId,
        taskTitle,
        assignedBy,
      },
    })
  }

  /**
   * Helper: Notify expense approval
   */
  static async notifyExpenseApproved(
    orgId: number,
    userId: number,
    expenseId: number,
    amount: number,
    approvedBy: string
  ) {
    await this.createNotification({
      orgId,
      userId,
      type: 'EXPENSE_APPROVED',
      title: 'Expense Approved',
      message: `Your expense of $${amount} has been approved by ${approvedBy}`,
      data: {
        expenseId,
        amount,
        approvedBy,
      },
    })
  }

  /**
   * Helper: Notify invoice generated
   */
  static async notifyInvoiceGenerated(
    orgId: number,
    userId: number,
    invoiceId: number,
    invoiceNumber: string,
    amount: number
  ) {
    await this.createNotification({
      orgId,
      userId,
      type: 'INVOICE_GENERATED',
      title: 'Invoice Generated',
      message: `Invoice ${invoiceNumber} for $${amount} has been created`,
      data: {
        invoiceId,
        invoiceNumber,
        amount,
      },
    })
  }

  /**
   * Helper: Notify report ready
   */
  static async notifyReportReady(
    orgId: number,
    userId: number,
    reportType: string,
    downloadUrl: string
  ) {
    await this.createNotification({
      orgId,
      userId,
      type: 'REPORT_READY',
      title: 'Report Ready',
      message: `Your ${reportType} report is ready for download`,
      data: {
        reportType,
        downloadUrl,
      },
    })
  }
}

export const notificationService = NotificationService
