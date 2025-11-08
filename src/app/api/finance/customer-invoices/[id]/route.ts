import { NextRequest } from 'next/server'
import { invoiceService } from '@/services/invoice.service'
import { successResponse, notFoundResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema, updateInvoiceSchema } from '@/lib/validation'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id)
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const invoice = await invoiceService.getById(id, organizationId)
    if (!invoice) return notFoundResponse('Invoice')
    return successResponse(invoice)
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id)
    const body = await req.json()
    const data = updateInvoiceSchema.parse(body)
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const result = await invoiceService.update(id, organizationId, data)
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
    const result = await invoiceService.delete(id, organizationId)
    if (!result.success) return handleError(new Error(result.error))
    return successResponse({ message: 'Invoice deleted successfully' })
  } catch (error) {
    return handleError(error)
  }
}
