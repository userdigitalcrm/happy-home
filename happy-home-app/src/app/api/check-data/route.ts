import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const districts = await prisma.district.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { buildings: true }
        }
      }
    })

    const totalBuildings = await prisma.building.count({
      where: { isActive: true }
    })

    const buildingsByDistrict = await prisma.building.groupBy({
      by: ['districtId'],
      _count: true,
      where: { isActive: true }
    })

    const sampleBuildings = await prisma.building.findMany({
      take: 10,
      include: {
        district: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      summary: {
        totalDistricts: districts.length,
        totalBuildings,
        buildingsByDistrictCount: buildingsByDistrict.length
      },
      districts: districts.map(d => ({
        id: d.id,
        name: d.name,
        buildingsCount: d._count.buildings
      })),
      sampleBuildings: sampleBuildings.map(b => ({
        id: b.id,
        district: b.district.name,
        address: `${b.street}, ${b.houseNumber}`,
        yearBuilt: b.yearBuilt,
        wallMaterial: b.wallMaterial,
        totalFloors: b.totalFloors
      }))
    })
  } catch (error) {
    console.error('Check data error:', error)
    return NextResponse.json(
      { error: 'Failed to check data' },
      { status: 500 }
    )
  }
}