import { prisma } from '@/lib/prisma'
import { eventService, EntityType, EventType } from './event.service'
import type { Prisma } from '@prisma/client'
import type { PaginatedResponse } from '@/types/common'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Sales Order Service
 * Implements complete CRUD, status workflow, and invoice linking
 */

export type SalesOrderStatus = 'draft' | 'confirmed' | 'invoiced' | 'cancelled'

export interface CreateSalesOrderInput {
  organizationId: number
  projectId?: number
  soNumber: string
  partnerName?: string
  orderDate?: Date
  totalAmount: number
  metadata?: Record<string, any>
}

export interface UpdateSalesOrderInput {
  soNumber?: string
  partnerName?: string
  orderDate?: Date
  totalAmount?: number
  metadata?: Record<string, any>
}

export class SalesOrderService {
  /**
   * Validate status transition
   */
  private validateTransition(
    from: string,
    to: SalesOrderStatus
  ): { valid: boolean; error?: string } {
    const transitions: Record<string, SalesOrderStatus[]> = {
      draft: ['confirmed', 'cancelled'],
      confirmed: ['invoiced', 'cancelled'],
      invoiced: [],
      cancelled: [],
    }

    if (!transitions[from]?.includes(to)) {
      return { valid: false, error: `Cannot transition from '${from}' to '${to}'` }
    }
    return { valid: true }
  }

  /**
   * Create sales order
   */
  async create(input: CreateSalesOrderInput) {
    try {
      const salesOrder = await prisma.$transaction(async (tx) => {
        const so = await tx.salesOrder.create({
          data: {
            organizationId: input.organizationId,
            projectId: input.projectId,
            soNumber: input.soNumber,
            partnerName: input.partnerName,
            orderDate: input.orderDate || new Date(),
            totalAmount: new Decimal(input.totalAmount),
            metadata: input.metadata,
            status: 'draft',
          },
        })

        await eventService.logEvent(
          input.organizationId,
          EntityType.SALES_ORDER,
          so.id,
          EventType.SALES_ORDER_CREATED,
          { soNumber: so.soNumber, totalAmount: so.totalAmount.toString() }
        )

        return so
      })

      return { success: true, data: salesOrder }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create sales order' }
    }
  }

  /**
   * Get sales order by ID
   */
  async getById(id: number, organizationId: number) {
    return prisma.salesOrder.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        customerInvoices: { where: { deletedAt: null } },
      },
    })
  }

  /**
   * List sales orders with filters
   */
  async list(
    organizationId: number,
    filters: {
      status?: SalesOrderStatus
      projectId?: number
      partnerName?: string
      startDate?: Date
      endDate?: Date
    } = {},
    page: number = 1,
    pageSize: number = 25
  ): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * pageSize

    const where: Prisma.SalesOrderWhereInput = {
      organizationId,
      deletedAt: null,
      ...(filters.status && { status: filters.status }),
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.partnerName && {
        partnerName: { contains: filters.partnerName, mode: 'insensitive' },
      }),
      ...(filters.startDate && { orderDate: { gte: filters.startDate } }),
      ...(filters.endDate && { orderDate: { lte: filters.endDate } }),
    }

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          project: { select: { id: true, name: true } },
          _count: { select: { customerInvoices: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salesOrder.count({ where }),
    ])

    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  }

  /**
   * Update sales order
   */
  async update(id: number, organizationId: number, input: UpdateSalesOrderInput) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Sales order not found' }
      
      if (current.status !== 'draft') {
        return { success: false, error: 'Can only edit draft sales orders' }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const so = await tx.salesOrder.update({
          where: { id },
          data: {
            ...(input.soNumber && { soNumber: input.soNumber }),
            ...(input.partnerName !== undefined && { partnerName: input.partnerName }),
            ...(input.orderDate && { orderDate: input.orderDate }),
            ...(input.totalAmount !== undefined && { totalAmount: new Decimal(input.totalAmount) }),
            ...(input.metadata && { metadata: input.metadata }),
          },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.SALES_ORDER,
          id,
          EventType.SALES_ORDER_UPDATED,
          { changes: input }
        )

        return so
      })

      return { success: true, data: updated }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' }
    }
  }

  /**
   * Confirm sales order (draft → confirmed)
   */
  async confirm(id: number, organizationId: number) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Sales order not found' }

      const check = this.validateTransition(current.status, 'confirmed')
      if (!check.valid) return { success: false, error: check.error }

      const confirmed = await prisma.$transaction(async (tx) => {
        const so = await tx.salesOrder.update({
          where: { id },
          data: { status: 'confirmed' },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.SALES_ORDER,
          id,
          EventType.SALES_ORDER_CONFIRMED,
          { soNumber: so.soNumber }
        )

        return so
      })

      return { success: true, data: confirmed }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Confirm failed' }
    }
  }

  /**
   * Cancel sales order
   */
  async cancel(id: number, organizationId: number) {
    try {
      const current = await this.getById(id, organizationId)
      if (!current) return { success: false, error: 'Sales order not found' }

      const check = this.validateTransition(current.status, 'cancelled')
      if (!check.valid) return { success: false, error: check.error }

      const cancelled = await prisma.$transaction(async (tx) => {
        const so = await tx.salesOrder.update({
          where: { id },
          data: { status: 'cancelled' },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.SALES_ORDER,
          id,
          EventType.SALES_ORDER_CANCELLED,
          { soNumber: so.soNumber }
        )

        return so
      })

      return { success: true, data: cancelled }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Cancel failed' }
    }
  }

  /**
   * Soft delete
   */
  async delete(id: number, organizationId: number) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.salesOrder.update({
          where: { id, organizationId },
          data: { deletedAt: new Date() },
        })

        await eventService.logEvent(
          organizationId,
          EntityType.SALES_ORDER,
          id,
          EventType.SALES_ORDER_DELETED,
          {}
        )
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' }
    }
  }
}

export const salesOrderService = new SalesOrderService()
