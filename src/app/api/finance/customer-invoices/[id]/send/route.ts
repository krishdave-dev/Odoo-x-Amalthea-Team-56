import { NextRequest } from 'next/server'
import { invoiceService } from '@/services/invoice.service'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idSchema.parse(params.id)
    const { searchParams } = new URL(req.url)
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const result = await invoiceService.send(id, organizationId)
    if (!result.success) return handleError(new Error(result.error))
    return successResponse(result.data)
  } catch (error) {
    return handleError(error)
  }
}
