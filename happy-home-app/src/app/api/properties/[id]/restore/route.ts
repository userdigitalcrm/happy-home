import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: { id: string }
}

export async function POST(request: NextRequest, context: Context) {
  console.log("Restore request received for property ID:", context.params.id)
  
  const session = await getServerSession(authOptions)
  console.log("Session:", session ? "Found" : "Not found", "User role:", session?.user?.role)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = context.params

  try {
    console.log("Starting transaction to restore property")
    const property = await prisma.$transaction(async (tx) => {
      const updated = await tx.property.update({
        where: { id },
        data: { isArchived: false }
      })

      // Проверяем наличие ID пользователя
      if (!session.user.id) {
        console.error("User ID is missing in session")
        throw new Error("User ID is required")
      }

      await tx.propertyHistory.create({
        data: {
          propertyId: id,
          userId: session.user.id,
          action: 'RESTORED'
        }
      })
      console.log("History entry created with userId:", session.user.id)

      return updated
    })

    return NextResponse.json(property)
  } catch (error) {
    console.error("Restore property error:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    return NextResponse.json({ error: "Failed to restore property" }, { status: 500 })
  }
}