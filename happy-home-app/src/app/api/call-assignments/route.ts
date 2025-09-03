import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN or MANAGER can assign properties
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { propertyIds, agentId } = body as { propertyIds: string[]; agentId: string }

    if (!Array.isArray(propertyIds) || propertyIds.length === 0 || !agentId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Create assignments (handle duplicates manually)
    for (const propertyId of propertyIds) {
      try {
        await prisma.callAssignment.create({
          data: { propertyId, agentId }
        })
      } catch (createError: any) {
        // Ignore duplicate key errors (code 23505 for PostgreSQL, SQLITE_CONSTRAINT_UNIQUE for SQLite)
        if (createError.code !== '23505' && !createError.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
          throw createError
        }
      }
    }

    // Log history for each property
    await Promise.all(
      propertyIds.map((propertyId) =>
        prisma.propertyHistory.create({
          data: {
            propertyId,
            userId: session.user.id,
            action: 'ASSIGNED',
            notes: `Назначен для прозвона агенту ${agentId}`
          }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CallAssignment POST error:', error)
    return NextResponse.json({ error: 'Failed to assign properties' }, { status: 500 })
  }
}