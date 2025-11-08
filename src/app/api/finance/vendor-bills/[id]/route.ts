import { NextRequest } from 'next/server'
import { billService } from '@/services/bill.service'
import { successResponse, notFoundResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema, updateBillSchema } from '@/lib/validation'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id)
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const bill = await billService.getById(id, organizationId)
    if (!bill) return notFoundResponse('Vendor bill')
    return successResponse(bill)
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id)
    const body = await req.json()
    const data = updateBillSchema.parse(body)
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const result = await billService.update(id, organizationId, data)
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
    const result = await billService.delete(id, organizationId)
    if (!result.success) return handleError(new Error(result.error))
    return successResponse({ message: 'Vendor bill deleted successfully' })
  } catch (error) {
    return handleError(error)
  }
}
