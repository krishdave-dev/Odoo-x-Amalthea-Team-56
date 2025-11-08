import { NextRequest } from 'next/server'
import { expenseService } from '@/services/expense.service'
import { successResponse, paginatedResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { createExpenseSchema, expenseQuerySchema, idSchema } from '@/lib/validation'
import { z } from 'zod'
import { withAuth, getOrganizationId } from '@/lib/middleware/auth'

/**
 * GET /api/expenses
 * Fetch expenses with filters and pagination
 * 
 * Permissions:
 * - Admin/Manager/Finance: All expenses in org
 * - Member: Only their own expenses
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req)
    if (error) return error

    const { searchParams } = new URL(req.url)
    
    // Parse and validate query parameters
    const query = expenseQuerySchema.parse({
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '25',
      status: searchParams.get('status') || undefined,
      userId: searchParams.get('userId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      billable: searchParams.get('billable') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      minAmount: searchParams.get('minAmount') || undefined,
      maxAmount: searchParams.get('maxAmount') || undefined,
    })

    const organizationId = idSchema.parse(getOrganizationId(user!).toString())

    // Build filters
    const filters: any = {
      status: query.status,
      userId: query.userId,
      projectId: query.projectId,
      billable: query.billable,
      startDate: query.startDate,
      endDate: query.endDate,
      minAmount: query.minAmount,
      maxAmount: query.maxAmount,
    }

    // Members can only see their own expenses
    if (user!.role === 'member') {
      filters.userId = user!.id
    }

    // Fetch expenses
    const result = await expenseService.getExpenses(
      organizationId,
      filters,
      query.page,
      query.pageSize
    )

    return paginatedResponse(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(error)
    }
    return handleError(error)
  }
}

/**
 * POST /api/expenses
 * Create a new expense
 * 
 * Permissions: All authenticated users can create expenses
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req, {
      requirePermissions: ['canCreateExpenses']
    })
    if (error) return error

    const body = await req.json()
    
    // Validate request body
    const data = createExpenseSchema.parse(body)

    // Use authenticated user as creator
    const createdByUserId = user!.id

    // Create expense
    const result = await expenseService.createExpense(data, createdByUserId)

    if (!result.success) {
      return handleError(new Error(result.error))
    }

    return successResponse(result.expense, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(error)
    }
    return handleError(error)
  }
}
