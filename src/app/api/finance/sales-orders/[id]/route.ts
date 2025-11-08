import { NextRequest } from 'next/server'
import { salesOrderService } from '@/services/sales-order.service'
import { successResponse, notFoundResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema, updateSalesOrderSchema } from '@/lib/validation'

/**
 * GET /api/finance/sales-orders/[id]
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id)
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))

    const salesOrder = await salesOrderService.getById(id, organizationId)

    if (!salesOrder) {
      return notFoundResponse('Sales order')
    }

    return successResponse(salesOrder)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/finance/sales-orders/[id]
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id)
    const body = await req.json()
    const data = updateSalesOrderSchema.parse(body)
    
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))

    const result = await salesOrderService.update(id, organizationId, data)

    if (!result.success) {
      return handleError(new Error(result.error))
    }

    return successResponse(result.data)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/finance/sales-orders/[id]
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id)
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))

    const result = await salesOrderService.delete(id, organizationId)

    if (!result.success) {
      return handleError(new Error(result.error))
    }

    return successResponse({ message: 'Sales order deleted successfully' })
  } catch (error) {
    return handleError(error)
  }
}
