import { NextRequest } from 'next/server'
import { expenseService } from '@/services/expense.service'
import { getCurrentUser } from '@/lib/session'
import { canApproveExpense } from '@/lib/permissions'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema, expenseWorkflowSchema } from '@/lib/validation'

/**
 * POST /api/expenses/[id]/reject
 * Reject expense (submitted → rejected)
 * Requires: canApproveExpenses permission (admin, manager, or finance)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    // Check permission - same as approve
    if (!canApproveExpense(user.role)) {
      return errorResponse('Insufficient permissions to reject expenses', 403)
    }

    const { id } = await params
    const expenseId = idSchema.parse(id)
    
    // Parse optional reason from body
    const body = await req.json().catch(() => ({}))
    const { reason } = expenseWorkflowSchema.parse(body)
    
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))

    // Verify organization access
    if (organizationId !== user.organizationId) {
      return errorResponse('Access denied to this organization', 403)
    }

    const result = await expenseService.rejectExpense(
      expenseId,
      organizationId,
      user.id,
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
