import { NextRequest } from 'next/server'
import { exportWorker, ExportType, ExportFormat } from '@/lib/workers/export-worker'
import { successResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * POST /api/admin/jobs/export/run
 * 
 * Manually trigger data export job
 * Body:
 * - organizationId (required)
 * - userId (required)
 * - exportType (required): events | projects | timesheets | expenses | invoices | bills
 * - format (required): csv | xlsx | pdf
 * - filters (optional): Additional filters for export
 * 
 * RBAC: Admin/Manager only (TODO: Add auth middleware)
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add RBAC check
    const body = await req.json()
    
    const organizationId = idSchema.parse(body.organizationId)
    const userId = idSchema.parse(body.userId)
    const exportType = body.exportType as ExportType
    const format = body.format as ExportFormat
    const filters = body.filters || {}

    // Validate export type and format
    const validExportTypes: ExportType[] = ['events', 'projects', 'timesheets', 'expenses', 'invoices', 'bills']
    const validFormats: ExportFormat[] = ['csv', 'xlsx', 'pdf']

    if (!validExportTypes.includes(exportType)) {
      return successResponse({
        success: false,
        error: `Invalid export type. Valid types: ${validExportTypes.join(', ')}`,
      }, 400)
    }

    if (!validFormats.includes(format)) {
      return successResponse({
        success: false,
        error: `Invalid format. Valid formats: ${validFormats.join(', ')}`,
      }, 400)
    }

    // Process export in background
    const result = await exportWorker.processExport({
      organizationId,
      userId,
      exportType,
      format,
      filters,
    })

    if (!result.success) {
      return successResponse({
        success: false,
        error: result.error,
      }, 400)
    }

    return successResponse({
      success: true,
      message: 'Export completed successfully',
      filename: result.filename,
      downloadUrl: result.downloadUrl,
      recordCount: result.recordCount,
    })
  } catch (error) {
    return handleError(error)
  }
}
