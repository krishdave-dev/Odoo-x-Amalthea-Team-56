import { prisma } from '@/lib/prisma'
import { eventService, EntityType, EventType } from './event.service'
import type { Prisma } from '@prisma/client'
import type { PaginatedResponse } from '@/types/common'
import { Decimal } from '@prisma/client/runtime/library'

export type BillStatus = 'draft' | 'received' | 'paid' | 'cancelled'

export interface CreateBillInput {
  organizationId: number
  projectId?: number
  poId?: number
  vendorName?: string
  billDate?: Date
  amount: number
  metadata?: Record<string, any>
}

export interface UpdateBillInput {
  vendorName?: string
  billDate?: Date
  amount?: number
  metadata?: Record<string, any>
}

export class BillService {
  private validateTransition(from: string, to: BillStatus): { valid: boolean; error?: string } {
    const transitions: Record<string, BillStatus[]> = {
      draft: ['received', 'cancelled'],
      received: ['paid', 'cancelled'],
      paid: [],
      cancelled: [],
    }

    if (!transitions[from]?.includes(to)) {
      return { valid: false, error: `Cannot transition from '${from}' to '${to}'` }
    }
    return { valid: true }
  }

  async create(input: CreateBillInput) {
    try {
      // If linking to PO, validate it exists and belongs to org
      if (input.poId) {
        const po = await prisma.purchaseOrder.findFirst({
          where: { id: input.poId, organizationId: input.organizationId, deletedAt: null },
        })
        if (!po) {
          return { success: false, error: 'Purchase order not found or does not belong to organization' }
        }
      }

      const bill = await prisma.$transaction(async (tx) => {
        const vb = await tx.vendorBill.create({
          data: {
            organizationId: input.organizationId,
            projectId: input.projectId,
            poId: input.poId,
            vendorName: input.vendorName,
            billDate: input.billDate || new Date(),
            amount: new Decimal(input.amount),
            metadata: input.metadata,
            status: 'draft',
          },
        })

        await eventService.logEvent(
          input.organizationId,
          EntityType.BILL,
          vb.id,
          EventType.BILL_CREATED,
          { vendorName: vb.vendorName, amount: vb.amount.toString(), poId: input.poId }
        )

        // If linked to PO, log that event too
        if (input.poId) {
          await eventService.logEvent(
            input.organizationId,
            EntityType.BILL,
            vb.id,
            EventType.BILL_LINKED_TO_PO,
            { poId: input.poId }
          )
        }

        return vb
      })

      return { success: true, data: bill }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create bill' }
    }
  }

  async getById(id: number, organizationId: number) {
    return prisma.vendorBill.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        purchaseOrder: { select: { id: true, poNumber: true, vendorName: true } },
      },
    })
  }

  async list(
    organizationId: number,
    filters: {
      status?: BillStatus
      projectId?: number
      poId?: number
      vendorName?: string
      startDate?: Date
      endDate?: Date
    } = {},
    page: number = 1,
    pageSize: number = 25
  ): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * pageSize

    const where: Prisma.VendorBillWhereInput = {
      organizationId,
      deletedAt: null,
      ...(filters.status && { status: filters.status }),
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.poId && { poId: filters.poId }),
      ...(filters.vendorName && {
        vendorName: { contains: filters.vendorName, mode: 'insensitive' },
      }),
      ...(filters.startDate && { billDate: { gte: filters.startDate } }),
      ...(filters.endDate && { billDate: { lte: filters.endDate } }),
    }

    const [data, total] = await Promise.all([
      prisma.vendorBill.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          project: { select: { id: true, name: true } },
          purchaseOrder: { select: { id: true, poNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vendorBill.count({ where }),
    ])

    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  }

  async update(id: number, organizationId: number, input: UpdateBillInput) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Bill not found' }
      
      if (current.status !== 'draft') {
        return { success: false, error: 'Can only edit draft bills' }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const vb = await tx.vendorBill.update({
          where: { id },
          data: {
            ...(input.vendorName !== undefined && { vendorName: input.vendorName }),
            ...(input.billDate && { billDate: input.billDate }),
            ...(input.amount !== undefined && { amount: new Decimal(input.amount) }),
            ...(input.metadata && { metadata: input.metadata }),
          },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.BILL,
          id,
          EventType.BILL_UPDATED,
          { changes: input }
        )

        return vb
      })

      return { success: true, data: updated }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' }
    }
  }

  async receive(id: number, organizationId: number) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Bill not found' }

      const check = this.validateTransition(current.status, 'received')
      if (!check.valid) return { success: false, error: check.error }

      const received = await prisma.$transaction(async (tx) => {
        const vb = await tx.vendorBill.update({
          where: { id },
          data: { status: 'received' },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.BILL,
          id,
          EventType.BILL_RECEIVED,
          { vendorName: vb.vendorName }
        )

        return vb
      })

      return { success: true, data: received }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Receive failed' }
    }
  }

  async markPaid(id: number, organizationId: number) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Bill not found' }

      const check = this.validateTransition(current.status, 'paid')
      if (!check.valid) return { success: false, error: check.error }

      const paid = await prisma.$transaction(async (tx) => {
        const vb = await tx.vendorBill.update({
          where: { id },
          data: { status: 'paid' },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.BILL,
          id,
          EventType.BILL_PAID,
          { vendorName: vb.vendorName, amount: vb.amount.toString() }
        )

        // If linked to PO, check if all bills are paid and update PO status
        if (vb.poId) {
          const allBills = await tx.vendorBill.findMany({
            where: { poId: vb.poId, deletedAt: null },
          })
          const allPaid = allBills.every(b => b.status === 'paid')
          
          if (allPaid) {
            await tx.purchaseOrder.update({
              where: { id: vb.poId },
              data: { status: 'billed' },
            })
            await eventService.logEvent(
              organizationId,
              EntityType.PURCHASE_ORDER,
              vb.poId,
              EventType.PURCHASE_ORDER_BILLED,
              { triggeredByBill: id }
            )
          }
        }

        return vb
      })

      return { success: true, data: paid }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Mark paid failed' }
    }
  }

  async cancel(id: number, organizationId: number) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Bill not found' }

      const check = this.validateTransition(current.status, 'cancelled')
      if (!check.valid) return { success: false, error: check.error }

      const cancelled = await prisma.$transaction(async (tx) => {
        const vb = await tx.vendorBill.update({
          where: { id },
          data: { status: 'cancelled' },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.BILL,
          id,
          EventType.BILL_CANCELLED,
          { vendorName: vb.vendorName }
        )

        return vb
      })

      return { success: true, data: cancelled }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Cancel failed' }
    }
  }

  async delete(id: number, organizationId: number) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.vendorBill.update({
          where: { id, organizationId },
          data: { deletedAt: new Date() },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.BILL,
          id,
          EventType.BILL_DELETED,
          {}
        )
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' }
    }
  }
}

export const billService = new BillService()
