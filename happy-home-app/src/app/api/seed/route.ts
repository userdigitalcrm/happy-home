import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting seed operation...')

    // Create basic districts
    const districts = [
      { name: 'Центр', description: 'Центральный район' },
      { name: 'Бензострой', description: 'Район Бензострой (Береке)' },
      { name: 'Вокзал', description: 'Район Вокзала' },
      { name: '20 мкр', description: '20 микрорайон' },
      { name: 'Рабочий', description: 'Рабочий поселок' },
      { name: 'Уют', description: 'Район Уют' },
      { name: 'Северный', description: 'Северный район' },
      { name: 'ДСР', description: 'Район ДСР' }
    ]

    const districtMap = new Map()
    let districtsCreated = 0

    for (const districtData of districts) {
      try {
        let district = await prisma.district.findFirst({
          where: { name: districtData.name }
        })

        if (!district) {
          district = await prisma.district.create({
            data: {
              name: districtData.name,
              description: districtData.description,
              isActive: true
            }
          })
          districtsCreated++
        }

        districtMap.set(districtData.name, district.id)
      } catch (error) {
        console.error(`Error creating district ${districtData.name}:`, error)
      }
    }

    // Create sample buildings
    const buildings = [
      { district: 'Центр', street: 'Назарбаева', houseNumber: '107', yearBuilt: 1966, wallMaterial: 'к', layout: 'стар', totalFloors: 5 },
      { district: 'Центр', street: 'Абая', houseNumber: '96', yearBuilt: 1976, wallMaterial: 'п', layout: 'ул', totalFloors: 5 },
      
      { district: 'Бензострой', street: 'Уральская', houseNumber: '30', yearBuilt: 2017, wallMaterial: 'к', layout: 'новостр', totalFloors: 5 },
      { district: 'Бензострой', street: 'Гагарина', houseNumber: '4А', yearBuilt: 2013, wallMaterial: 'к', layout: 'нов', totalFloors: 5 },
      { district: 'Бензострой', street: 'Ухабова', houseNumber: '29а', yearBuilt: 2014, wallMaterial: 'к', layout: 'новостр', totalFloors: 3 },
      
      { district: 'Вокзал', street: 'Кошукова', houseNumber: '7', yearBuilt: 1980, wallMaterial: 'к', layout: 'ул', totalFloors: 9 },
      { district: 'Вокзал', street: 'Батыр Баяна', houseNumber: '67', yearBuilt: 1991, wallMaterial: 'к', layout: 'лен', totalFloors: 5 },
      { district: 'Вокзал', street: 'Лесная', houseNumber: '3', yearBuilt: 1991, wallMaterial: 'к', layout: 'нов', totalFloors: 6 },
      
      { district: '20 мкр', street: 'Жукова', houseNumber: '7', yearBuilt: 1992, wallMaterial: 'п', layout: 'ул', totalFloors: 10 },
      { district: '20 мкр', street: 'Шухова', houseNumber: '4', yearBuilt: 1974, wallMaterial: 'п', layout: 'ул', totalFloors: 5 },
      { district: '20 мкр', street: 'Рахимова', houseNumber: '29', yearBuilt: 1980, wallMaterial: 'п', layout: 'ул', totalFloors: 5 },
      
      { district: 'Рабочий', street: 'Украинская', houseNumber: '219', yearBuilt: 2001, wallMaterial: 'к', layout: 'нов', totalFloors: 5 },
      { district: 'Рабочий', street: 'Украинская', houseNumber: '219А', yearBuilt: 2000, wallMaterial: 'к', layout: 'нов', totalFloors: 5 },
      
      { district: 'Уют', street: 'Мусрепова', houseNumber: '9Б', yearBuilt: 1973, wallMaterial: 'п', layout: 'ул', totalFloors: 5 },
      { district: 'Уют', street: 'Назарбаева', houseNumber: '187', yearBuilt: 1970, wallMaterial: 'к', layout: 'ул', totalFloors: 5 },
      
      { district: 'Северный', street: 'Назарбаева', houseNumber: '193', yearBuilt: 1967, wallMaterial: 'п', layout: 'ул', totalFloors: 5 },
      { district: 'Северный', street: 'Ярослава Гашека', houseNumber: '17', yearBuilt: 1970, wallMaterial: 'п', layout: 'ул', totalFloors: 5 },
      
      { district: 'ДСР', street: 'Труда', houseNumber: '53', yearBuilt: 1960, wallMaterial: 'д', layout: 'стар', totalFloors: 2 },
      { district: 'ДСР', street: 'Индустриальная', houseNumber: '9', yearBuilt: 1970, wallMaterial: 'к', layout: 'стар', totalFloors: 2 }
    ]

    let buildingsCreated = 0
    let buildingsSkipped = 0

    for (const buildingData of buildings) {
      try {
        const districtId = districtMap.get(buildingData.district)
        if (!districtId) {
          buildingsSkipped++
          continue
        }

        const existingBuilding = await prisma.building.findFirst({
          where: {
            districtId,
            street: buildingData.street,
            houseNumber: buildingData.houseNumber
          }
        })

        if (!existingBuilding) {
          await prisma.building.create({
            data: {
              districtId,
              street: buildingData.street,
              houseNumber: buildingData.houseNumber,
              yearBuilt: buildingData.yearBuilt,
              wallMaterial: buildingData.wallMaterial,
              layout: buildingData.layout,
              totalFloors: buildingData.totalFloors,
              hasElevator: buildingData.totalFloors > 5,
              hasGarbageChute: buildingData.totalFloors > 3,
              heatingType: 'центральное',
              isActive: true
            }
          })
          buildingsCreated++
        } else {
          buildingsSkipped++
        }
      } catch (error) {
        console.error(`Error creating building ${buildingData.street} ${buildingData.houseNumber}:`, error)
        buildingsSkipped++
      }
    }

    const result = {
      success: true,
      message: 'Seeding completed successfully',
      stats: {
        districtsCreated,
        buildingsCreated,
        buildingsSkipped,
        totalDistricts: districts.length,
        totalBuildings: buildings.length
      }
    }

    console.log('Seeding completed:', result)
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Seeding error:', error)
    return NextResponse.json(
      { error: 'Failed to seed data', details: error.message },
      { status: 500 }
    )
  }
}