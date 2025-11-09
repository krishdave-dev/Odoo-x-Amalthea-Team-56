import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { canManageFinanceDocuments } from '@/lib/permissions'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    if (!canManageFinanceDocuments(user.role)) {
      return errorResponse('Insufficient permissions', 403)
    }

    const { id } = await params
    const body = await req.json()
    
    const updated = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        projectId: body.projectId,
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
    })

    return successResponse(updated)
  } catch (error) {
    return handleError(error)
  }
}
