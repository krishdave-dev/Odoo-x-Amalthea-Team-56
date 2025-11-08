import { prisma } from '@/lib/prisma'
import { eventService, EntityType, EventType } from './event.service'
import type { Prisma } from '@prisma/client'
import type { PaginatedResponse } from '@/types/common'
import { Decimal } from '@prisma/client/runtime/library'

export type PurchaseOrderStatus = 'draft' | 'confirmed' | 'billed' | 'cancelled'

export interface CreatePurchaseOrderInput {
  organizationId: number
  projectId?: number
  poNumber: string
  vendorName?: string
  orderDate?: Date
  totalAmount: number
  metadata?: Record<string, any>
}

export interface UpdatePurchaseOrderInput {
  poNumber?: string
  vendorName?: string
  orderDate?: Date
  totalAmount?: number
  metadata?: Record<string, any>
}

export class PurchaseOrderService {
  private validateTransition(from: string, to: PurchaseOrderStatus): { valid: boolean; error?: string } {
    const transitions: Record<string, PurchaseOrderStatus[]> = {
      draft: ['confirmed', 'cancelled'],
      confirmed: ['billed', 'cancelled'],
      billed: [],
      cancelled: [],
    }

    if (!transitions[from]?.includes(to)) {
      return { valid: false, error: `Cannot transition from '${from}' to '${to}'` }
    }
    return { valid: true }
  }

  async create(input: CreatePurchaseOrderInput) {
    try {
      const purchaseOrder = await prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.create({
          data: {
            organizationId: input.organizationId,
            projectId: input.projectId,
            poNumber: input.poNumber,
            vendorName: input.vendorName,
            orderDate: input.orderDate || new Date(),
            totalAmount: new Decimal(input.totalAmount),
            metadata: input.metadata,
            status: 'draft',
          },
        })

        await eventService.logEvent(
          input.organizationId,
          EntityType.PURCHASE_ORDER,
          po.id,
          EventType.PURCHASE_ORDER_CREATED,
          { poNumber: po.poNumber, totalAmount: po.totalAmount.toString() }
        )

        return po
      })

      return { success: true, data: purchaseOrder }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create purchase order' }
    }
  }

  async getById(id: number, organizationId: number) {
    return prisma.purchaseOrder.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        vendorBills: { where: { deletedAt: null } },
      },
    })
  }

  async list(
    organizationId: number,
    filters: {
      status?: PurchaseOrderStatus
      projectId?: number
      vendorName?: string
      startDate?: Date
      endDate?: Date
    } = {},
    page: number = 1,
    pageSize: number = 25
  ): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * pageSize

    const where: Prisma.PurchaseOrderWhereInput = {
      organizationId,
      deletedAt: null,
      ...(filters.status && { status: filters.status }),
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.vendorName && {
        vendorName: { contains: filters.vendorName, mode: 'insensitive' },
      }),
      ...(filters.startDate && { orderDate: { gte: filters.startDate } }),
      ...(filters.endDate && { orderDate: { lte: filters.endDate } }),
    }

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          project: { select: { id: true, name: true } },
          _count: { select: { vendorBills: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where }),
    ])

    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  }

  async update(id: number, organizationId: number, input: UpdatePurchaseOrderInput) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Purchase order not found' }
      
      if (current.status !== 'draft') {
        return { success: false, error: 'Can only edit draft purchase orders' }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.update({
          where: { id },
          data: {
            ...(input.poNumber && { poNumber: input.poNumber }),
            ...(input.vendorName !== undefined && { vendorName: input.vendorName }),
            ...(input.orderDate && { orderDate: input.orderDate }),
            ...(input.totalAmount !== undefined && { totalAmount: new Decimal(input.totalAmount) }),
            ...(input.metadata && { metadata: input.metadata }),
          },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.PURCHASE_ORDER,
          id,
          EventType.PURCHASE_ORDER_UPDATED,
          { changes: input }
        )

        return po
      })

      return { success: true, data: updated }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' }
    }
  }

  async confirm(id: number, organizationId: number) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Purchase order not found' }

      const check = this.validateTransition(current.status, 'confirmed')
      if (!check.valid) return { success: false, error: check.error }

      const confirmed = await prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.update({
          where: { id },
          data: { status: 'confirmed' },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.PURCHASE_ORDER,
          id,
          EventType.PURCHASE_ORDER_CONFIRMED,
          { poNumber: po.poNumber }
        )

        return po
      })

      return { success: true, data: confirmed }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Confirm failed' }
    }
  }

  async cancel(id: number, organizationId: number) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Purchase order not found' }

      const check = this.validateTransition(current.status, 'cancelled')
      if (!check.valid) return { success: false, error: check.error }

      const cancelled = await prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.update({
          where: { id },
          data: { status: 'cancelled' },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.PURCHASE_ORDER,
          id,
          EventType.PURCHASE_ORDER_CANCELLED,
          { poNumber: po.poNumber }
        )

        return po
      })

      return { success: true, data: cancelled }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Cancel failed' }
    }
  }

  async delete(id: number, organizationId: number) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.purchaseOrder.update({
          where: { id, organizationId },
          data: { deletedAt: new Date() },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.PURCHASE_ORDER,
          id,
          EventType.PURCHASE_ORDER_DELETED,
          {}
        )
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' }
    }
  }
}

export const purchaseOrderService = new PurchaseOrderService()
