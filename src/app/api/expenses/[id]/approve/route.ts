import { NextRequest } from 'next/server'
import { expenseService } from '@/services/expense.service'
import { getCurrentUser } from '@/lib/session'
import { canApproveExpense } from '@/lib/permissions'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * POST /api/expenses/[id]/approve
 * Approve expense (submitted → approved)
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

    // Check permission
    if (!canApproveExpense(user.role)) {
      return errorResponse('Insufficient permissions to approve expenses', 403)
    }

    const { id } = await params
    const expenseId = idSchema.parse(id)
    
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))

    // Verify organization access
    if (organizationId !== user.organizationId) {
      return errorResponse('Access denied to this organization', 403)
    }

    const result = await expenseService.approveExpense(expenseId, organizationId, user.id)

    if (!result.success) {
      return handleError(new Error(result.error))
    }

    return successResponse(result.expense)
  } catch (error) {
    return handleError(error)
  }
}
