import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

interface CSVRow {
  'КАТ': string
  'Статус': string
  'Район': string
  'Цена': string
  'План': string
  'Эт': string
  'Эть': string
  'М': string
  'S': string
  'S кх': string
  'Блкн': string
  'П': string
  'Состояние': string
  'Телефон': string
  'Улица': string
  'Д-кв': string
  'Год': string
  'Изм': string
  'Создано': string
  'Фото': string
  'Источник': string
  'Описание': string
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n')
  const headers = lines[0].split(',')
  const rows: CSVRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    
    const values = lines[i].split(',')
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row as CSVRow)
  }
  
  return rows
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('Начинаю импорт данных из CSV...')

    // Путь к CSV файлу
    const csvPath = path.join(process.cwd(), '..', 'База недвижимости.csv')
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: `Файл не найден: ${csvPath}` },
        { status: 404 }
      )
    }

    // Читаем CSV файл
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const csvData = parseCSV(csvContent)
    
    const districts = new Set<string>()
    const buildings = new Map<string, any>()

    // Обрабатываем данные
    csvData.forEach(row => {
      // Собираем районы
      if (row['Район'] && row['Район'].trim()) {
        districts.add(row['Район'].trim())
      }
      
      // Собираем здания
      if (row['Район'] && row['Улица'] && row['Д-кв']) {
        const district = row['Район'].trim()
        const street = row['Улица'].trim()
        const houseNumber = row['Д-кв'].toString().trim()
        const key = `${district}_${street}_${houseNumber}`
        
        if (!buildings.has(key)) {
          buildings.set(key, {
            district,
            street,
            houseNumber,
            yearBuilt: row['Год'] ? parseInt(row['Год']) : null,
            wallMaterial: row['М'] || null,
            layout: row['План'] || null,
            totalFloors: row['Эть'] ? parseInt(row['Эть']) : null,
            hasElevator: false,
            hasGarbageChute: false,
            heatingType: 'центральное'
          })
        }
      }
    })

    console.log(`Найдено ${districts.size} уникальных районов`)
    console.log(`Найдено ${buildings.size} уникальных зданий`)

    // Импортируем районы
    const districtMap = new Map<string, string>()
    let districtsCreated = 0
    
    for (const districtName of districts) {
      try {
        let district = await prisma.district.findFirst({
          where: { name: districtName }
        })
        
        if (!district) {
          district = await prisma.district.create({
            data: {
              name: districtName,
              description: `Район ${districtName}`,
              isActive: true
            }
          })
          districtsCreated++
        }
        
        districtMap.set(districtName, district.id)
      } catch (error) {
        console.error(`Ошибка при создании района ${districtName}:`, error)
      }
    }

    // Импортируем здания
    let buildingsCreated = 0
    let buildingsSkipped = 0
    
    for (const [key, buildingData] of buildings) {
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
              hasElevator: buildingData.hasElevator,
              hasGarbageChute: buildingData.hasGarbageChute,
              heatingType: buildingData.heatingType,
              isActive: true
            }
          })
          buildingsCreated++
        } else {
          buildingsSkipped++
        }
      } catch (error) {
        console.error(`Ошибка при создании здания ${key}:`, error)
        buildingsSkipped++
      }
    }

    const result = {
      message: 'Импорт завершён успешно',
      stats: {
        csvRecords: csvData.length,
        districtsFound: districts.size,
        districtsCreated,
        buildingsFound: buildings.size,
        buildingsCreated,
        buildingsSkipped
      }
    }

    console.log('Результаты импорта:', result)
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Ошибка импорта:', error)
    return NextResponse.json(
      { error: 'Ошибка импорта данных', details: error.message },
      { status: 500 }
    )
  }
}