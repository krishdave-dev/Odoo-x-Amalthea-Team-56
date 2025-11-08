import { NextRequest } from 'next/server'
import { eventService } from '@/services/event.service'
import { exportService } from '@/services/export.service'
import { handleError } from '@/lib/error'
import { idSchema } from '@/lib/validation'

/**
 * GET /api/admin/events/export
 * 
 * Export events to CSV, Excel, or PDF
 * Query params:
 * - organizationId (required)
 * - format (required): csv | xlsx | pdf
 * - entityType (optional)
 * - entityId (optional)
 * - eventType (optional)
 * - fromDate (optional)
 * - toDate (optional)
 * 
 * RBAC: Admin only (TODO: Add auth middleware)
 * 
 * Returns: File download
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Add RBAC check
    const { searchParams } = new URL(req.url)
    
    const organizationId = idSchema.parse(searchParams.get('organizationId'))
    const format = searchParams.get('format') || 'csv'

    if (!exportService.isValidFormat(format)) {
      return new Response(
        JSON.stringify({ error: 'Invalid format. Use: csv, xlsx, or pdf' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const filters = {
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') ? parseInt(searchParams.get('entityId')!) : undefined,
      eventType: searchParams.get('eventType') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
    }

    // Fetch events (capped at 10k)
    const events = await eventService.getEventsForExport(organizationId, filters)

    // Generate export
    const result = exportService.exportEvents(events, format as any, 'audit_events')

    // Return as downloadable file
    return new Response(result.data, {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': exportService.getContentDisposition(result.filename),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
