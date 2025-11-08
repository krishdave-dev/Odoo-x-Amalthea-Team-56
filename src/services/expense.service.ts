import { prisma } from '@/lib/prisma'
import { eventService } from './event.service'
import type { Expense, Prisma, User } from '@prisma/client'
import type { PaginatedResponse } from '@/types/common'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Expense status types
 */
export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'

/**
 * User role types for RBAC
 */
export type UserRole = 'employee' | 'manager' | 'project_manager' | 'finance' | 'admin'

/**
 * Expense creation input
 */
export interface CreateExpenseInput {
  organizationId: number
  projectId?: number
  userId?: number
  amount: number
  billable: boolean
  note?: string
  receiptUrl?: string
}

/**
 * Expense update input
 */
export interface UpdateExpenseInput {
  amount?: number
  billable?: boolean
  note?: string
  receiptUrl?: string
}

/**
 * Expense filters for queries
 */
export interface ExpenseFilters {
  status?: ExpenseStatus
  userId?: number
  projectId?: number
  billable?: boolean
  startDate?: Date
  endDate?: Date
  minAmount?: number
  maxAmount?: number
}

/**
 * ExpenseService - Business logic for expense management
 * Implements CRUD, state transitions, RBAC, and audit logging
 */
export class ExpenseService {
  /**
   * Validate user permissions for expense actions
   */
  private async validateUserPermission(
    userId: number,
    requiredRoles: UserRole[]
  ): Promise<{ allowed: boolean; user?: User; error?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return { allowed: false, error: 'User not found' }
    }

    if (!user.isActive) {
      return { allowed: false, error: 'User is inactive' }
    }

    const hasPermission = requiredRoles.includes(user.role as UserRole)
    
    if (!hasPermission) {
      return { 
        allowed: false, 
        error: `User role '${user.role}' is not authorized. Required: ${requiredRoles.join(', ')}` 
      }
    }

    return { allowed: true, user }
  }

  /**
   * Check if user owns the expense
   */
  private async isExpenseOwner(expenseId: number, userId: number): Promise<boolean> {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      select: { userId: true },
    })

    return expense?.userId === userId
  }

  /**
   * Validate expense state transition
   */
  private validateStateTransition(
    currentStatus: string,
    targetStatus: ExpenseStatus
  ): { valid: boolean; error?: string } {
    const transitions: Record<string, ExpenseStatus[]> = {
      draft: ['submitted'],
      submitted: ['approved', 'rejected'],
      approved: ['paid'],
      rejected: [],
      paid: [],
    }

    const allowedTransitions = transitions[currentStatus] || []
    
    if (!allowedTransitions.includes(targetStatus)) {
      return {
        valid: false,
        error: `Cannot transition from '${currentStatus}' to '${targetStatus}'`,
      }
    }

    return { valid: true }
  }

  /**
   * Create a new expense
   */
  async createExpense(
    input: CreateExpenseInput,
    createdByUserId: number
  ): Promise<{ success: boolean; expense?: Expense; error?: string }> {
    try {
      // Validate organization exists
      const organization = await prisma.organization.findUnique({
        where: { id: input.organizationId },
      })

      if (!organization) {
        return { success: false, error: 'Organization not found' }
      }

      // If projectId provided, validate it belongs to organization
      if (input.projectId) {
        const project = await prisma.project.findFirst({
          where: {
            id: input.projectId,
            organizationId: input.organizationId,
            deletedAt: null,
          },
        })

        if (!project) {
          return { success: false, error: 'Project not found or does not belong to organization' }
        }
      }

      // Use transaction to ensure atomicity
      const expense = await prisma.$transaction(async (tx) => {
        // Create the expense
        const newExpense = await tx.expense.create({
          data: {
            organizationId: input.organizationId,
            projectId: input.projectId,
            userId: input.userId || createdByUserId,
            amount: new Decimal(input.amount),
            billable: input.billable,
            note: input.note,
            receiptUrl: input.receiptUrl,
            status: 'draft',
          },
        })

        // Log event
        await eventService.logExpenseCreated(
          input.organizationId,
          newExpense.id,
          {
            amount: input.amount,
            userId: newExpense.userId || undefined,
            projectId: input.projectId,
            billable: input.billable,
          }
        )

        return newExpense
      })

      return { success: true, expense }
    } catch (error) {
      console.error('Failed to create expense:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create expense',
      }
    }
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(
    expenseId: number,
    organizationId: number
  ): Promise<Expense | null> {
    return prisma.expense.findFirst({
      where: {
        id: expenseId,
        organizationId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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
   * Get expenses with filters and pagination
   */
  async getExpenses(
    organizationId: number,
    filters: ExpenseFilters = {},
    page: number = 1,
    pageSize: number = 25
  ): Promise<PaginatedResponse<Expense>> {
    const skip = (page - 1) * pageSize
    const take = pageSize

    const where: Prisma.ExpenseWhereInput = {
      organizationId,
      deletedAt: null,
      ...(filters.status && { status: filters.status }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.billable !== undefined && { billable: filters.billable }),
      ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
      ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
      ...(filters.minAmount && { amount: { gte: new Decimal(filters.minAmount) } }),
      ...(filters.maxAmount && { amount: { lte: new Decimal(filters.maxAmount) } }),
    }

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.expense.count({ where }),
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
   * Update expense (only allowed in draft status)
   */
  async updateExpense(
    expenseId: number,
    organizationId: number,
    userId: number,
    input: UpdateExpenseInput
  ): Promise<{ success: boolean; expense?: Expense; error?: string }> {
    try {
      // Get current expense
      const currentExpense = await this.getExpenseById(expenseId, organizationId)

      if (!currentExpense) {
        return { success: false, error: 'Expense not found' }
      }

      // Only draft expenses can be edited
      if (currentExpense.status !== 'draft') {
        return {
          success: false,
          error: `Cannot edit expense in '${currentExpense.status}' status. Only draft expenses can be edited.`,
        }
      }

      // Check ownership or admin permission
      const isOwner = await this.isExpenseOwner(expenseId, userId)
      const { allowed, user } = await this.validateUserPermission(userId, [
        'admin',
        'manager',
        'employee',
      ])

      if (!isOwner && user?.role !== 'admin') {
        return { success: false, error: 'Not authorized to edit this expense' }
      }

      // Update expense
      const expense = await prisma.$transaction(async (tx) => {
        const updated = await tx.expense.update({
          where: { id: expenseId },
          data: {
            ...(input.amount !== undefined && { amount: new Decimal(input.amount) }),
            ...(input.billable !== undefined && { billable: input.billable }),
            ...(input.note !== undefined && { note: input.note }),
            ...(input.receiptUrl !== undefined && { receiptUrl: input.receiptUrl }),
            updatedAt: new Date(),
          },
        })

        // Log update event
        await eventService.logExpenseUpdated(organizationId, expenseId, input)

        return updated
      })

      return { success: true, expense }
    } catch (error) {
      console.error('Failed to update expense:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update expense',
      }
    }
  }

  /**
   * Submit expense for approval (draft → submitted)
   */
  async submitExpense(
    expenseId: number,
    organizationId: number,
    userId: number
  ): Promise<{ success: boolean; expense?: Expense; error?: string }> {
    try {
      // Get current expense
      const currentExpense = await this.getExpenseById(expenseId, organizationId)

      if (!currentExpense) {
        return { success: false, error: 'Expense not found' }
      }

      // Validate state transition
      const transitionCheck = this.validateStateTransition(currentExpense.status, 'submitted')
      if (!transitionCheck.valid) {
        return { success: false, error: transitionCheck.error }
      }

      // Check ownership
      const isOwner = await this.isExpenseOwner(expenseId, userId)
      if (!isOwner) {
        return { success: false, error: 'Only expense owner can submit for approval' }
      }

      // Submit expense
      const expense = await prisma.$transaction(async (tx) => {
        const updated = await tx.expense.update({
          where: { id: expenseId },
          data: {
            status: 'submitted',
            submittedAt: new Date(),
            updatedAt: new Date(),
          },
        })

        // Log submission event
        await eventService.logExpenseSubmitted(organizationId, expenseId, {
          userId,
          amount: Number(updated.amount),
          projectId: updated.projectId || undefined,
        })

        return updated
      })

      return { success: true, expense }
    } catch (error) {
      console.error('Failed to submit expense:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit expense',
      }
    }
  }

  /**
   * Approve expense (submitted → approved)
   */
  async approveExpense(
    expenseId: number,
    organizationId: number,
    approverId: number
  ): Promise<{ success: boolean; expense?: Expense; error?: string }> {
    try {
      // Validate approver has permission
      const permissionCheck = await this.validateUserPermission(approverId, [
        'manager',
        'project_manager',
        'admin',
      ])

      if (!permissionCheck.allowed) {
        return { success: false, error: permissionCheck.error }
      }

      // Get current expense
      const currentExpense = await this.getExpenseById(expenseId, organizationId)

      if (!currentExpense) {
        return { success: false, error: 'Expense not found' }
      }

      // Validate state transition
      const transitionCheck = this.validateStateTransition(currentExpense.status, 'approved')
      if (!transitionCheck.valid) {
        return { success: false, error: transitionCheck.error }
      }

      // Approve expense
      const expense = await prisma.$transaction(async (tx) => {
        const updated = await tx.expense.update({
          where: { id: expenseId },
          data: {
            status: 'approved',
            approvedBy: approverId,
            approvedAt: new Date(),
            updatedAt: new Date(),
          },
        })

        // Log approval event
        await eventService.logExpenseApproved(organizationId, expenseId, {
          approvedBy: approverId,
          amount: Number(updated.amount),
          userId: updated.userId || undefined,
        })

        return updated
      })

      return { success: true, expense }
    } catch (error) {
      console.error('Failed to approve expense:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve expense',
      }
    }
  }

  /**
   * Reject expense (submitted → rejected)
   */
  async rejectExpense(
    expenseId: number,
    organizationId: number,
    rejectorId: number,
    reason?: string
  ): Promise<{ success: boolean; expense?: Expense; error?: string }> {
    try {
      // Validate rejector has permission
      const permissionCheck = await this.validateUserPermission(rejectorId, [
        'manager',
        'project_manager',
        'admin',
      ])

      if (!permissionCheck.allowed) {
        return { success: false, error: permissionCheck.error }
      }

      // Get current expense
      const currentExpense = await this.getExpenseById(expenseId, organizationId)

      if (!currentExpense) {
        return { success: false, error: 'Expense not found' }
      }

      // Validate state transition
      const transitionCheck = this.validateStateTransition(currentExpense.status, 'rejected')
      if (!transitionCheck.valid) {
        return { success: false, error: transitionCheck.error }
      }

      // Reject expense
      const expense = await prisma.$transaction(async (tx) => {
        const updated = await tx.expense.update({
          where: { id: expenseId },
          data: {
            status: 'rejected',
            rejectionReason: reason,
            updatedAt: new Date(),
          },
        })

        // Log rejection event
        await eventService.logExpenseRejected(organizationId, expenseId, {
          rejectedBy: rejectorId,
          reason,
          amount: Number(updated.amount),
        })

        return updated
      })

      return { success: true, expense }
    } catch (error) {
      console.error('Failed to reject expense:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject expense',
      }
    }
  }

  /**
   * Mark expense as paid (approved → paid)
   */
  async markAsPaid(
    expenseId: number,
    organizationId: number,
    financeUserId: number
  ): Promise<{ success: boolean; expense?: Expense; error?: string }> {
    try {
      // Validate finance user has permission
      const permissionCheck = await this.validateUserPermission(financeUserId, [
        'finance',
        'admin',
      ])

      if (!permissionCheck.allowed) {
        return { success: false, error: permissionCheck.error }
      }

      // Get current expense
      const currentExpense = await this.getExpenseById(expenseId, organizationId)

      if (!currentExpense) {
        return { success: false, error: 'Expense not found' }
      }

      // Validate state transition
      const transitionCheck = this.validateStateTransition(currentExpense.status, 'paid')
      if (!transitionCheck.valid) {
        return { success: false, error: transitionCheck.error }
      }

      // Mark as paid
      const expense = await prisma.$transaction(async (tx) => {
        const updated = await tx.expense.update({
          where: { id: expenseId },
          data: {
            status: 'paid',
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        })

        // Log payment event
        await eventService.logExpensePaid(organizationId, expenseId, {
          paidBy: financeUserId,
          amount: Number(updated.amount),
          userId: updated.userId || undefined,
        })

        return updated
      })

      return { success: true, expense }
    } catch (error) {
      console.error('Failed to mark expense as paid:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark expense as paid',
      }
    }
  }

  /**
   * Soft delete expense
   */
  async deleteExpense(
    expenseId: number,
    organizationId: number,
    userId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current expense
      const currentExpense = await this.getExpenseById(expenseId, organizationId)

      if (!currentExpense) {
        return { success: false, error: 'Expense not found' }
      }

      // Check if user can delete (owner or admin)
      const isOwner = await this.isExpenseOwner(expenseId, userId)
      const { user } = await this.validateUserPermission(userId, ['admin', 'manager', 'employee'])

      if (!isOwner && user?.role !== 'admin') {
        return { success: false, error: 'Not authorized to delete this expense' }
      }

      // Don't allow deletion of paid expenses
      if (currentExpense.status === 'paid') {
        return { success: false, error: 'Cannot delete paid expenses' }
      }

      // Soft delete
      await prisma.$transaction(async (tx) => {
        await tx.expense.update({
          where: { id: expenseId },
          data: {
            deletedAt: new Date(),
          },
        })

        // Log deletion event
        await eventService.logExpenseDeleted(organizationId, expenseId, {
          deletedBy: userId,
          amount: Number(currentExpense.amount),
        })
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to delete expense:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete expense',
      }
    }
  }

  /**
   * Get expense statistics
   */
  async getExpenseStats(filters: {
    organizationId: number
    projectId?: number
    userId?: number
    startDate?: Date
    endDate?: Date
  }) {
    const where: Prisma.ExpenseWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
      ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
    }

    const [statusBreakdown, totalStats, billableStats] = await Promise.all([
      // Group by status
      prisma.expense.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: {
          amount: true,
        },
      }),

      // Overall totals
      prisma.expense.aggregate({
        where,
        _count: true,
        _sum: {
          amount: true,
        },
        _avg: {
          amount: true,
        },
      }),

      // Billable vs non-billable
      prisma.expense.groupBy({
        by: ['billable'],
        where,
        _count: true,
        _sum: {
          amount: true,
        },
      }),
    ])

    return {
      byStatus: statusBreakdown,
      totals: totalStats,
      byBillable: billableStats,
    }
  }
}

// Export singleton instance
export const expenseService = new ExpenseService()
