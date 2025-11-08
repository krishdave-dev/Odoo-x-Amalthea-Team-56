/**
 * POST /api/attachments/process-outbox
 * Trigger outbox event processing (for cron jobs or manual triggers)
 */

import { NextRequest, NextResponse } from 'next/server'
import { processOutboxEvents, getOutboxStats } from '@/lib/outboxProcessor'
import { handleError } from '@/lib/error'

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication/authorization
    // Only allow from authorized sources (cron, admin)

    const result = await processOutboxEvents()

    return NextResponse.json({
      success: true,
      data: result,
      message: `Processed ${result.processed} events, ${result.failed} failed`,
    })
  } catch (error) {
    return handleError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = await getOutboxStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    return handleError(error)
  }
}
