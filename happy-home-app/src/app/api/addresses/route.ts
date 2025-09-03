import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const districtId = searchParams.get('districtId')
    const street = searchParams.get('street')
    const houseNumber = searchParams.get('houseNumber')

    if (districtId) {
      // Get all buildings in district
      const buildings = await prisma.building.findMany({
        where: {
          districtId,
          isActive: true
        },
        include: {
          district: true
        },
        orderBy: [
          { street: 'asc' },
          { houseNumber: 'asc' }
        ]
      })

      return NextResponse.json(buildings)
    }

    if (districtId && street && houseNumber) {
      // Get specific building with full details
      const building = await prisma.building.findFirst({
        where: {
          districtId,
          street,
          houseNumber,
          isActive: true
        },
        include: {
          district: true
        }
      })

      if (building) {
        return NextResponse.json({
          building,
          autoFillData: {
            yearBuilt: building.yearBuilt,
            wallMaterial: building.wallMaterial,
            layout: building.layout,
            totalFloors: building.totalFloors,
            hasElevator: building.hasElevator,
            heatingType: building.heatingType
          }
        })
      }
    }

    // Get all districts for address selection
    const districts = await prisma.district.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ districts })
  } catch (error) {
    console.error('Address fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch address data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      districtId,
      street,
      houseNumber,
      yearBuilt,
      wallMaterial,
      layout,
      totalFloors,
      hasElevator,
      heatingType
    } = body

    if (!districtId || !street || !houseNumber) {
      return NextResponse.json(
        { error: 'District, street, and house number are required' },
        { status: 400 }
      )
    }

    const building = await prisma.building.create({
      data: {
        districtId,
        street,
        houseNumber,
        yearBuilt,
        wallMaterial,
        layout,
        totalFloors,
        hasElevator: hasElevator || false,
        heatingType
      },
      include: {
        district: true
      }
    })

    return NextResponse.json(building, { status: 201 })
  } catch (error) {
    console.error('Building creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create building' },
      { status: 500 }
    )
  }
}