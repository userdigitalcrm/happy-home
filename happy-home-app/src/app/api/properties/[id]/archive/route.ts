import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: Context) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const params = await context.params
  const { id } = params

  try {
    const property = await prisma.$transaction(async (tx) => {
      const updated = await tx.property.update({
        where: { id },
        data: { isArchived: true }
      })

      await tx.propertyHistory.create({
        data: {
          propertyId: id,
          userId: session.user.id,
          action: 'ARCHIVED'
        }
      })

      return updated
    })

    return NextResponse.json(property)
  } catch (error) {
    console.error('Archive property error:', error)
    return NextResponse.json({ error: 'Failed to archive property' }, { status: 500 })
  }
}