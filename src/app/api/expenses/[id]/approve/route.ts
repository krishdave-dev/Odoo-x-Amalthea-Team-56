import { NextRequest } from 'next/server'
import { expenseService } from '@/services/expense.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * POST /api/expenses/[id]/approve
 * Approve expense (submitted → approved)
 * Requires manager, project_manager, or admin role
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = idSchema.parse(params.id)
    
    // organizationId and userId should come from authenticated session
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const approverId = idSchema.parse(searchParams.get('userId') || '1')

    const result = await expenseService.approveExpense(expenseId, organizationId, approverId)

    if (!result.success) {
      return handleError(new Error(result.error))
    }

    return successResponse(result.expense)
  } catch (error) {
    return handleError(error)
  }
}
