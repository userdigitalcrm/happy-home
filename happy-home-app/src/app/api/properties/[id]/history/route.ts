import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this property
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        createdById: true,
        assignedToId: true
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Role-based access control
    if (session.user.role === 'AGENT' && 
        property.assignedToId !== session.user.id && 
        property.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const history = await prisma.propertyHistory.findMany({
      where: { propertyId: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Property history fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property history' },
      { status: 500 }
    )
  }
}