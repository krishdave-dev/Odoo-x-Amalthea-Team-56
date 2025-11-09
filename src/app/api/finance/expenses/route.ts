import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    const { searchParams } = new URL(req.url)
    const organizationId = parseInt(searchParams.get('organizationId') || '0')

    if (organizationId !== user.organizationId) {
      return errorResponse('Access denied', 403)
    }

    const expenses = await prisma.expense.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse({ expenses })
  } catch (error) {
    return handleError(error)
  }
}
