import { prisma } from '@/lib/prisma'
import { eventService, EntityType, EventType } from './event.service'
import type { Prisma } from '@prisma/client'
import type { PaginatedResponse } from '@/types/common'
import { Decimal } from '@prisma/client/runtime/library'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'

export interface CreateInvoiceInput {
  organizationId: number
  projectId?: number
  soId?: number
  invoiceNumber: string
  invoiceDate?: Date
  amount: number
  metadata?: Record<string, any>
}

export interface UpdateInvoiceInput {
  invoiceNumber?: string
  invoiceDate?: Date
  amount?: number
  metadata?: Record<string, any>
}

export class InvoiceService {
  private validateTransition(from: string, to: InvoiceStatus): { valid: boolean; error?: string } {
    const transitions: Record<string, InvoiceStatus[]> = {
      draft: ['sent', 'cancelled'],
      sent: ['paid', 'cancelled'],
      paid: [],
      cancelled: [],
    }

    if (!transitions[from]?.includes(to)) {
      return { valid: false, error: `Cannot transition from '${from}' to '${to}'` }
    }
    return { valid: true }
  }

  async create(input: CreateInvoiceInput) {
    try {
      // If linking to SO, validate it exists and belongs to org
      if (input.soId) {
        const so = await prisma.salesOrder.findFirst({
          where: { id: input.soId, organizationId: input.organizationId, deletedAt: null },
        })
        if (!so) {
          return { success: false, error: 'Sales order not found or does not belong to organization' }
        }
      }

      const invoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.customerInvoice.create({
          data: {
            organizationId: input.organizationId,
            projectId: input.projectId,
            soId: input.soId,
            invoiceNumber: input.invoiceNumber,
            invoiceDate: input.invoiceDate || new Date(),
            amount: new Decimal(input.amount),
            metadata: input.metadata,
            status: 'draft',
          },
        })

        await eventService.logEvent(
          input.organizationId,
          EntityType.INVOICE,
          inv.id,
          EventType.INVOICE_CREATED,
          { invoiceNumber: inv.invoiceNumber, amount: inv.amount.toString(), soId: input.soId }
        )

        // If linked to SO, log that event too
        if (input.soId) {
          await eventService.logEvent(
            input.organizationId,
            EntityType.INVOICE,
            inv.id,
            EventType.INVOICE_LINKED_TO_SO,
            { soId: input.soId }
          )
        }

        return inv
      })

      return { success: true, data: invoice }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create invoice' }
    }
  }

  async getById(id: number, organizationId: number) {
    return prisma.customerInvoice.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        salesOrder: { select: { id: true, soNumber: true, partnerName: true } },
      },
    })
  }

  async list(
    organizationId: number,
    filters: {
      status?: InvoiceStatus
      projectId?: number
      soId?: number
      startDate?: Date
      endDate?: Date
    } = {},
    page: number = 1,
    pageSize: number = 25
  ): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * pageSize

    const where: Prisma.CustomerInvoiceWhereInput = {
      organizationId,
      deletedAt: null,
      ...(filters.status && { status: filters.status }),
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.soId && { soId: filters.soId }),
      ...(filters.startDate && { invoiceDate: { gte: filters.startDate } }),
      ...(filters.endDate && { invoiceDate: { lte: filters.endDate } }),
    }

    const [data, total] = await Promise.all([
      prisma.customerInvoice.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          project: { select: { id: true, name: true } },
          salesOrder: { select: { id: true, soNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customerInvoice.count({ where }),
    ])

    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  }

  async update(id: number, organizationId: number, input: UpdateInvoiceInput) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Invoice not found' }
      
      if (current.status !== 'draft') {
        return { success: false, error: 'Can only edit draft invoices' }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const inv = await tx.customerInvoice.update({
          where: { id },
          data: {
            ...(input.invoiceNumber && { invoiceNumber: input.invoiceNumber }),
            ...(input.invoiceDate && { invoiceDate: input.invoiceDate }),
            ...(input.amount !== undefined && { amount: new Decimal(input.amount) }),
            ...(input.metadata && { metadata: input.metadata }),
          },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.INVOICE,
          id,
          EventType.INVOICE_UPDATED,
          { changes: input }
        )

        return inv
      })

      return { success: true, data: updated }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' }
    }
  }

  async send(id: number, organizationId: number) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Invoice not found' }

      const check = this.validateTransition(current.status, 'sent')
      if (!check.valid) return { success: false, error: check.error }

      const sent = await prisma.$transaction(async (tx) => {
        const inv = await tx.customerInvoice.update({
          where: { id },
          data: { status: 'sent' },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.INVOICE,
          id,
          EventType.INVOICE_SENT,
          { invoiceNumber: inv.invoiceNumber }
        )

        return inv
      })

      return { success: true, data: sent }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Send failed' }
    }
  }

  async markPaid(id: number, organizationId: number) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Invoice not found' }

      const check = this.validateTransition(current.status, 'paid')
      if (!check.valid) return { success: false, error: check.error }

      const paid = await prisma.$transaction(async (tx) => {
        const inv = await tx.customerInvoice.update({
          where: { id },
          data: { status: 'paid' },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.INVOICE,
          id,
          EventType.INVOICE_PAID,
          { invoiceNumber: inv.invoiceNumber, amount: inv.amount.toString() }
        )

        // If linked to SO, check if all invoices are paid and update SO status
        if (inv.soId) {
          const allInvoices = await tx.customerInvoice.findMany({
            where: { soId: inv.soId, deletedAt: null },
          })
          const allPaid = allInvoices.every(i => i.status === 'paid')
          
          if (allPaid) {
            await tx.salesOrder.update({
              where: { id: inv.soId },
              data: { status: 'invoiced' },
            })
            await eventService.logEvent(
              organizationId,
              EntityType.SALES_ORDER,
              inv.soId,
              EventType.SALES_ORDER_INVOICED,
              { triggeredByInvoice: id }
            )
          }
        }

        return inv
      })

      return { success: true, data: paid }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Mark paid failed' }
    }
  }

  async cancel(id: number, organizationId: number) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Invoice not found' }

      const check = this.validateTransition(current.status, 'cancelled')
      if (!check.valid) return { success: false, error: check.error }

      const cancelled = await prisma.$transaction(async (tx) => {
        const inv = await tx.customerInvoice.update({
          where: { id },
          data: { status: 'cancelled' },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.INVOICE,
          id,
          EventType.INVOICE_CANCELLED,
          { invoiceNumber: inv.invoiceNumber }
        )

        return inv
      })

      return { success: true, data: cancelled }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Cancel failed' }
    }
  }

  async delete(id: number, organizationId: number) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.customerInvoice.update({
          where: { id, organizationId },
          data: { deletedAt: new Date() },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.INVOICE,
          id,
          EventType.INVOICE_DELETED,
          {}
        )
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' }
    }
  }
}

export const invoiceService = new InvoiceService()
