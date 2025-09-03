import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    // Verify assignment exists and belongs to agent
    // Using type assertion to help TypeScript recognize the property
    const assignment = await (prisma as any).callAssignment.findUnique({ where: { id } })
    if (!assignment || assignment.agentId !== session.user.id) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Update the assignment to mark as called
    const updated = await (prisma as any).callAssignment.update({
      where: { id },
      data: { isCalled: true }
    })

    // Add history record
    await prisma.propertyHistory.create({
      data: {
        propertyId: updated.propertyId,
        userId: session.user.id,
        action: 'UPDATED',
        notes: 'Прозвон подтвержден'
      }
    })

    // Optionally, delete the assignment after it's called to remove it from pinned list
    // This will completely remove the assignment from the database
    await (prisma as any).callAssignment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CallAssignment PUT error:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}