import { NextRequest } from 'next/server'
import { invoiceWorker } from '@/lib/workers/invoice-worker'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * POST /api/admin/jobs/invoices/run
 * 
 * Manually trigger invoice generation for an organization
 * Body:
 * - organizationId (required)
 * - projectId (optional): Generate for specific project only
 * 
 * RBAC: Admin only (TODO: Add auth middleware)
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add RBAC check
    // if (session.user.role !== 'admin') {
    //   return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 403 })
    // }

    const body = await req.json()
    const organizationId = idSchema.parse(body.organizationId)
    const projectId = body.projectId ? idSchema.parse(body.projectId) : undefined

    let result

    if (projectId) {
      // Generate invoice for specific project
      result = await invoiceWorker.generateInvoiceForProject(organizationId, projectId)
      
      if (!result.success) {
        return successResponse({
          success: false,
          error: result.error,
        }, 400)
      }

      return successResponse({
        success: true,
        message: 'Invoice generated successfully',
        invoiceId: result.invoiceId,
      })
    } else {
      // Generate invoices for all projects in organization
      result = await invoiceWorker.generateInvoices(organizationId)

      return successResponse({
        success: result.success,
        invoicesGenerated: result.invoicesGenerated,
        totalAmount: result.totalAmount,
        errors: result.errors,
        message: `Generated ${result.invoicesGenerated} invoices totaling $${result.totalAmount}`,
      })
    }
  } catch (error) {
    return handleError(error)
  }
}
