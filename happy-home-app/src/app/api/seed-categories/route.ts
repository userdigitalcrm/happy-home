import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Только администраторы могут выполнять этот endpoint
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Проверка существующих категорий
    const existingCategories = await prisma.category.findMany()
    
    if (existingCategories.length === 0) {
      // Создание категорий, если они отсутствуют
      const categories = await prisma.category.createMany({
        data: [
          { name: '1 Ком', description: '1-комнатная квартира' },
          { name: '2 Ком', description: '2-комнатная квартира' },
          { name: '3 Ком', description: '3-комнатная квартира' },
          { name: '4 Ком', description: '4-комнатная квартира' },
          { name: '5 Ком', description: '5-комнатная квартира' },
          { name: '6 Ком', description: '6-комнатная квартира' },
          { name: 'РИЭЛТОР', description: 'Коммерческая недвижимость' }
        ],
        skipDuplicates: true
      })
      
      return NextResponse.json({ 
        message: 'Categories created successfully', 
        count: categories.count 
      })
    } else {
      return NextResponse.json({ 
        message: 'Categories already exist', 
        count: existingCategories.length,
        categories: existingCategories.map(c => ({ id: c.id, name: c.name }))
      })
    }
  } catch (error: any) {
    console.error('Seed categories error:', error)
    return NextResponse.json(
      { error: 'Failed to seed categories', details: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}