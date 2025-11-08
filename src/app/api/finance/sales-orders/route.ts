import { NextRequest } from 'next/server'
import { salesOrderService } from '@/services/sales-order.service'
import { successResponse, paginatedResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { createSalesOrderSchema, salesOrderQuerySchema, idSchema } from '@/lib/validation'

/**
 * GET /api/finance/sales-orders
 * List sales orders with filters
 */
export async function GET(req: NextRequest) {
  try {
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
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createSalesOrderSchema.parse(body)

    const result = await salesOrderService.create(data)

    if (!result.success) {
      return handleError(new Error(result.error))
    }

    return successResponse(result.data, 201)
  } catch (error) {
    return handleError(error)
  }
}
