/**
 * ProjectLinksService - Fetch all related entities for a project
 * 
 * This service powers the "Links Panel" - a centralized hub showing
 * all connected records (tasks, invoices, timesheets, files, etc.)
 * 
 * Features:
 * - Concurrent fetching with Promise.all()
 * - Configurable limits per section
 * - Optional section filtering
 * - Multi-tenant security
 */

import { prisma } from '@/lib/prisma'

export interface ProjectLinksOptions {
  limit?: number
  include?: ('tasks' | 'timesheets' | 'invoices' | 'bills' | 'attachments' | 'events' | 'salesOrders' | 'purchaseOrders' | 'expenses')[]
}

export interface ProjectLinks {
  projectId: number
  links: {
    tasks: {
      id: number
      title: string
      status: string
      priority: number
      assignee?: {
        id: number
        name: string | null
      } | null
      dueDate: Date | null
      hoursLogged: number
    }[]
    timesheets: {
      id: number
      user: {
        id: number
        name: string | null
      }
      durationHours: number
      billable: boolean
      start: Date
      end: Date
      status: string
    }[]
    invoices: {
      id: number
      invoiceNumber: string
      amount: number
      status: string
      invoiceDate: Date
      salesOrder?: {
        id: number
        soNumber: string
      } | null
    }[]
    bills: {
      id: number
      vendorName: string | null
      amount: number
      status: string
      billDate: Date
      purchaseOrder?: {
        id: number
        poNumber: string
      } | null
    }[]
    salesOrders: {
      id: number
      soNumber: string
      partnerName: string | null
      totalAmount: number
      status: string
      orderDate: Date
    }[]
    purchaseOrders: {
      id: number
      poNumber: string
      vendorName: string | null
      totalAmount: number
      status: string
      orderDate: Date
    }[]
    expenses: {
      id: number
      amount: number
      billable: boolean
      status: string
      note: string | null
      user: {
        id: number
        name: string | null
      } | null
      createdAt: Date
    }[]
    attachments: {
      id: number
      fileName: string | null
      fileUrl: string
      uploadedBy: {
        id: number
        name: string | null
      } | null
      uploadedAt: Date
      status: string
    }[]
    events: {
      id: number
      eventType: string
      entityType: string
      entityId: number | null
      createdAt: Date
      payload?: any
    }[]
  }
}

export class ProjectLinksService {
  /**
   * Get all linked entities for a project
   * Uses Promise.all() for concurrent fetching
   */
  static async getProjectLinks(
    projectId: number,
    organizationId: number,
    options: ProjectLinksOptions = {}
  ): Promise<ProjectLinks> {
    const limit = options.limit ?? 5
    const include = options.include ?? [
      'tasks',
      'timesheets',
      'invoices',
      'bills',
      'salesOrders',
      'purchaseOrders',
      'expenses',
      'attachments',
      'events',
    ]

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
        deletedAt: null,
      },
    })

    if (!project) {
      throw new Error('Project not found or access denied')
    }

    // Fetch all related entities concurrently
    const [
      tasks,
      timesheets,
      invoices,
      bills,
      salesOrders,
      purchaseOrders,
      expenses,
      attachments,
      events,
    ] = await Promise.all([
      // Tasks
      include.includes('tasks')
        ? prisma.task.findMany({
            where: { projectId, deletedAt: null },
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              hoursLogged: true,
              assignee: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      // Timesheets
      include.includes('timesheets')
        ? prisma.timesheet.findMany({
            where: { projectId, deletedAt: null },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              durationHours: true,
              billable: true,
              start: true,
              end: true,
              status: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      // Customer Invoices
      include.includes('invoices')
        ? prisma.customerInvoice.findMany({
            where: { projectId, deletedAt: null },
            take: limit,
            orderBy: { invoiceDate: 'desc' },
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
              status: true,
              invoiceDate: true,
              salesOrder: {
                select: {
                  id: true,
                  soNumber: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      // Vendor Bills
      include.includes('bills')
        ? prisma.vendorBill.findMany({
            where: { projectId, deletedAt: null },
            take: limit,
            orderBy: { billDate: 'desc' },
            select: {
              id: true,
              vendorName: true,
              amount: true,
              status: true,
              billDate: true,
              purchaseOrder: {
                select: {
                  id: true,
                  poNumber: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      // Sales Orders
      include.includes('salesOrders')
        ? prisma.salesOrder.findMany({
            where: { projectId, deletedAt: null },
            take: limit,
            orderBy: { orderDate: 'desc' },
            select: {
              id: true,
              soNumber: true,
              partnerName: true,
              totalAmount: true,
              status: true,
              orderDate: true,
            },
          })
        : Promise.resolve([]),

      // Purchase Orders
      include.includes('purchaseOrders')
        ? prisma.purchaseOrder.findMany({
            where: { projectId, deletedAt: null },
            take: limit,
            orderBy: { orderDate: 'desc' },
            select: {
              id: true,
              poNumber: true,
              vendorName: true,
              totalAmount: true,
              status: true,
              orderDate: true,
            },
          })
        : Promise.resolve([]),

      // Expenses
      include.includes('expenses')
        ? prisma.expense.findMany({
            where: { projectId, deletedAt: null },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              amount: true,
              billable: true,
              status: true,
              note: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      // Attachments (files)
      include.includes('attachments')
        ? prisma.attachment.findMany({
            where: {
              ownerId: projectId,
              ownerType: 'project',
              organizationId,
            },
            take: limit,
            orderBy: { uploadedAt: 'desc' },
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              uploadedAt: true,
              status: true,
              uploader: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      // Events (audit log)
      include.includes('events')
        ? prisma.event.findMany({
            where: {
              organizationId,
              entityType: 'project',
              entityId: projectId,
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              eventType: true,
              entityType: true,
              entityId: true,
              createdAt: true,
              payload: true,
            },
          })
        : Promise.resolve([]),
    ])

    return {
      projectId,
      links: {
        tasks: tasks.map((t: any) => ({
          ...t,
          hoursLogged: Number(t.hoursLogged),
        })),
        timesheets: timesheets.map((t: any) => ({
          ...t,
          durationHours: Number(t.durationHours),
        })),
        invoices: invoices.map((i: any) => ({
          ...i,
          amount: Number(i.amount),
        })),
        bills: bills.map((b: any) => ({
          ...b,
          amount: Number(b.amount),
        })),
        salesOrders: salesOrders.map((so: any) => ({
          ...so,
          totalAmount: Number(so.totalAmount),
        })),
        purchaseOrders: purchaseOrders.map((po: any) => ({
          ...po,
          totalAmount: Number(po.totalAmount),
        })),
        expenses: expenses.map((e: any) => ({
          ...e,
          amount: Number(e.amount),
        })),
        attachments: attachments.map((a: any) => ({
          ...a,
          uploadedBy: a.uploader,
        })),
        events,
      },
    }
  }

  /**
   * Get counts for all linked entities (for dashboard badges)
   */
  static async getProjectLinksCounts(
    projectId: number,
    organizationId: number
  ): Promise<{
    projectId: number
    counts: {
      tasks: number
      timesheets: number
      invoices: number
      bills: number
      salesOrders: number
      purchaseOrders: number
      expenses: number
      attachments: number
      events: number
    }
  }> {
    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
        deletedAt: null,
      },
    })

    if (!project) {
      throw new Error('Project not found or access denied')
    }

    // Count all entities concurrently
    const [
      tasksCount,
      timesheetsCount,
      invoicesCount,
      billsCount,
      salesOrdersCount,
      purchaseOrdersCount,
      expensesCount,
      attachmentsCount,
      eventsCount,
    ] = await Promise.all([
      prisma.task.count({ where: { projectId, deletedAt: null } }),
      prisma.timesheet.count({ where: { projectId, deletedAt: null } }),
      prisma.customerInvoice.count({ where: { projectId, deletedAt: null } }),
      prisma.vendorBill.count({ where: { projectId, deletedAt: null } }),
      prisma.salesOrder.count({ where: { projectId, deletedAt: null } }),
      prisma.purchaseOrder.count({ where: { projectId, deletedAt: null } }),
      prisma.expense.count({ where: { projectId, deletedAt: null } }),
      prisma.attachment.count({
        where: { ownerId: projectId, ownerType: 'project', organizationId },
      }),
      prisma.event.count({
        where: { organizationId, entityType: 'project', entityId: projectId },
      }),
    ])

    return {
      projectId,
      counts: {
        tasks: tasksCount,
        timesheets: timesheetsCount,
        invoices: invoicesCount,
        bills: billsCount,
        salesOrders: salesOrdersCount,
        purchaseOrders: purchaseOrdersCount,
        expenses: expensesCount,
        attachments: attachmentsCount,
        events: eventsCount,
      },
    }
  }
}

export const projectLinksService = ProjectLinksService
