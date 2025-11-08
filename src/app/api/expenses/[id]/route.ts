import { NextRequest } from 'next/server'
import { expenseService } from '@/services/expense.service'
import { successResponse, notFoundResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/expenses/[id]
 * Get a single expense by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = idSchema.parse(params.id)
    
    // organizationId should come from authenticated session
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))

    const expense = await expenseService.getExpenseById(expenseId, organizationId)

    if (!expense) {
      return notFoundResponse('Expense')
    }

    return successResponse(expense)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/expenses/[id]
 * Soft delete an expense
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = idSchema.parse(params.id)
    
    // organizationId and userId should come from authenticated session
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const userId = idSchema.parse(searchParams.get('userId') || '1')

    const result = await expenseService.deleteExpense(expenseId, organizationId, userId)

    if (!result.success) {
      return handleError(new Error(result.error))
    }

    return successResponse({ message: 'Expense deleted successfully' })
  } catch (error) {
    return handleError(error)
  }
}
