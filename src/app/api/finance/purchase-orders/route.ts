import { NextRequest } from 'next/server'
import { purchaseOrderService } from '@/services/purchase-order.service'
import { successResponse, paginatedResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { createPurchaseOrderSchema, purchaseOrderQuerySchema, idSchema } from '@/lib/validation'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = purchaseOrderQuerySchema.parse({
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '25',
      status: searchParams.get('status') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      vendorName: searchParams.get('vendorName') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    })

    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const filters = { status: query.status, projectId: query.projectId, vendorName: query.vendorName, startDate: query.startDate, endDate: query.endDate }
    const result = await purchaseOrderService.list(organizationId, filters, query.page, query.pageSize)
    return paginatedResponse(result)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createPurchaseOrderSchema.parse(body)
    const result = await purchaseOrderService.create(data)
    if (!result.success) return handleError(new Error(result.error))
    return successResponse(result.data, 201)
  } catch (error) {
    return handleError(error)
  }
}
