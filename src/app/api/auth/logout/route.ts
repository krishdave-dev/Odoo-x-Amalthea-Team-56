import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getClientIp } from '@/lib/security'

/**
 * POST /api/auth/logout
 * Destroy user session and log event
 */
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req)
  const userAgent = req.headers.get('user-agent')
  
  try {
    const session = await getSession()
    
    // Log logout event before destroying session
    if (session.user && session.isLoggedIn) {
      await prisma.event.create({
        data: {
          organizationId: session.user.organizationId,
          entityType: 'User',
          entityId: session.user.id,
          eventType: 'USER_LOGOUT',
          payload: {
            userId: session.user.id,
            email: session.user.email,
            ip: clientIp,
            userAgent: userAgent,
            timestamp: new Date().toISOString(),
          },
        },
      }).catch((err: unknown) => {
        console.error('Failed to log logout event:', err)
      })
    }
    
    session.destroy()

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
