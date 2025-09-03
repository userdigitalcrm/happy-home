import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get various statistics
    const [
      totalProperties,
      activeProperties,
      soldProperties,
      rentedProperties,
      totalUsers,
      activeUsers,
      totalCategories,
      totalDistricts,
      propertiesByStatus,
      propertiesByCategory,
      propertiesByDistrict,
      recentActivities
    ] = await Promise.all([
      // Property statistics
      prisma.property.count(),
      prisma.property.count({ where: { status: 'ACTIVE', isArchived: false } }),
      prisma.property.count({ where: { status: 'SOLD' } }),
      prisma.property.count({ where: { status: 'RENTED' } }),
      
      // User statistics
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      
      // Reference data statistics
      prisma.category.count({ where: { isActive: true } }),
      prisma.district.count({ where: { isActive: true } }),
      
      // Detailed breakdowns
      prisma.property.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: { isArchived: false }
      }),
      
      prisma.property.groupBy({
        by: ['categoryId'],
        _count: { _all: true },
        where: { isArchived: false }
      }),
      
      prisma.property.groupBy({
        by: ['districtId'],
        _count: { _all: true },
        where: { isArchived: false }
      }),
      
      // Recent activities
      prisma.propertyHistory.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              building: {
                select: {
                  street: true,
                  houseNumber: true
                }
              },
              apartment: true
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ])

    // Calculate price statistics
    const priceStats = await prisma.property.aggregate({
      where: { 
        price: { not: null },
        status: 'ACTIVE',
        isArchived: false
      },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true }
    })

    // Get categories and districts for detailed stats
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    })

    const districts = await prisma.district.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    })

    // Format category statistics
    const categoryStats = propertiesByCategory.map(item => {
      const category = categories.find(c => c.id === item.categoryId)
      return {
        name: category?.name || 'Unknown',
        count: item._count._all
      }
    })

    // Format district statistics
    const districtStats = propertiesByDistrict.map(item => {
      const district = districts.find(d => d.id === item.districtId)
      return {
        name: district?.name || 'Unknown',
        count: item._count._all
      }
    })

    const statistics = {
      overview: {
        totalProperties,
        activeProperties,
        soldProperties,
        rentedProperties,
        totalUsers,
        activeUsers,
        totalCategories,
        totalDistricts
      },
      properties: {
        byStatus: propertiesByStatus.map(item => ({
          status: item.status,
          count: item._count._all
        })),
        byCategory: categoryStats,
        byDistrict: districtStats
      },
      prices: {
        average: priceStats._avg.price ? Math.round(priceStats._avg.price) : 0,
        minimum: priceStats._min.price || 0,
        maximum: priceStats._max.price || 0
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        field: activity.field,
        oldValue: activity.oldValue,
        newValue: activity.newValue,
        notes: activity.notes,
        createdAt: activity.createdAt,
        user: activity.user,
        property: {
          id: activity.property.id,
          address: `${activity.property.building.street}, ${activity.property.building.houseNumber}${activity.property.apartment ? `, кв. ${activity.property.apartment}` : ''}`
        }
      }))
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Statistics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}