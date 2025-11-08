import { NextRequest } from 'next/server'
import { purchaseOrderService } from '@/services/purchase-order.service'
import { successResponse, notFoundResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema, updatePurchaseOrderSchema } from '@/lib/validation'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id)
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const po = await purchaseOrderService.getById(id, organizationId)
    if (!po) return notFoundResponse('Purchase order')
    return successResponse(po)
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id)
    const body = await req.json()
    const data = updatePurchaseOrderSchema.parse(body)
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const result = await purchaseOrderService.update(id, organizationId, data)
    if (!result.success) return handleError(new Error(result.error))
    return successResponse(result.data)
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id)
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const result = await purchaseOrderService.delete(id, organizationId)
    if (!result.success) return handleError(new Error(result.error))
    return successResponse({ message: 'Purchase order deleted successfully' })
  } catch (error) {
    return handleError(error)
  }
}
