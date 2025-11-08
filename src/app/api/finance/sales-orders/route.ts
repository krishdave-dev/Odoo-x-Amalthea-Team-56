import { NextRequest } from 'next/server'
import { salesOrderService } from '@/services/sales-order.service'
import { getCurrentUser } from '@/lib/session'
import { canManageFinanceDocuments } from '@/lib/permissions'
import { successResponse, paginatedResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { createSalesOrderSchema, salesOrderQuerySchema, idSchema } from '@/lib/validation'

/**
 * GET /api/finance/sales-orders
 * List sales orders with filters
 * Requires: canManageFinance or canViewAllProjects permission
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    const { searchParams } = new URL(req.url)
    
    const query = salesOrderQuerySchema.parse({
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '25',
      status: searchParams.get('status') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      partnerName: searchParams.get('partnerName') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    })

    const organizationId = idSchema.parse(searchParams.get('organizationId'))

    // Verify organization access
    if (organizationId !== user.organizationId) {
      return errorResponse('Access denied to this organization', 403)
    }

    const filters = {
      status: query.status,
      projectId: query.projectId,
      partnerName: query.partnerName,
      startDate: query.startDate,
      endDate: query.endDate,
    }

    const result = await salesOrderService.list(organizationId, filters, query.page, query.pageSize)

    return paginatedResponse(result)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/finance/sales-orders
 * Create new sales order
 * Requires: canManageFinance permission (admin, manager, or finance role)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    // Check permission
    if (!canManageFinanceDocuments(user.role)) {
      return errorResponse('Insufficient permissions to create sales orders', 403)
    }

    const body = await req.json()
    const data = createSalesOrderSchema.parse(body)

    // Ensure sales order is in user's organization
    if (data.organizationId !== user.organizationId) {
      return errorResponse('Cannot create sales order in another organization', 403)
    }

    const result = await salesOrderService.create(data)

    if (!result.success) {
      return handleError(new Error(result.error))
    }

    return successResponse(result.data, 201)
  } catch (error) {
    return handleError(error)
  }
}
