import { NextRequest } from 'next/server'
import { expenseService } from '@/services/expense.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema, expenseWorkflowSchema } from '@/lib/validation'

/**
 * POST /api/expenses/[id]/reject
 * Reject expense (submitted → rejected)
 * Requires manager, project_manager, or admin role
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const expenseId = idSchema.parse(id)
    
    // Parse optional reason from body
    const body = await req.json().catch(() => ({}))
    const { reason } = expenseWorkflowSchema.parse(body)
    
    // organizationId and userId should come from authenticated session
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const rejectorId = idSchema.parse(searchParams.get('userId') || '1')

    const result = await expenseService.rejectExpense(
      expenseId,
      organizationId,
      rejectorId,
      reason
    )

    if (!result.success) {
      return handleError(new Error(result.error))
    }

    return successResponse(result.expense)
  } catch (error) {
    return handleError(error)
  }
}
