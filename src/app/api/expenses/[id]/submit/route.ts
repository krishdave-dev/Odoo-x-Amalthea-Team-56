import { NextRequest } from 'next/server'
import { expenseService } from '@/services/expense.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * POST /api/expenses/[id]/submit
 * Submit expense for approval (draft → submitted)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const expenseId = idSchema.parse(id)
    
    // organizationId and userId should come from authenticated session
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const userId = idSchema.parse(searchParams.get('userId') || '1')

    const result = await expenseService.submitExpense(expenseId, organizationId, userId)

    if (!result.success) {
      return handleError(new Error(result.error))
    }

    return successResponse(result.expense)
  } catch (error) {
    return handleError(error)
  }
}
