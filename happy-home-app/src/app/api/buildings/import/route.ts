import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import { Readable } from 'stream';

const prisma = new PrismaClient();

// Словарь для нормализации названий улиц
const STREET_NORMALIZER: Record<string, string> = {
  'Б.петрова': 'Бориса Петрова',
  'З.косм-й': 'Зои Космодемьянской',
  'Зои косм-й': 'Зои Космодемьянской',
  'К. либнехта': 'Карла Либкнехта',
  'К.сутюшева': 'Капитона Сутюшева',
  'К.туйская': 'Карагандинская',
  'У.громовой': 'Ульяны Громовой',
  'Ч.уалиханова': 'Чокана Уалиханова',
  'Я. гашека': 'Ярослава Гашека',
  'Пр.ахременко': 'проезд Ахременко',
  'Пр.волод-о': 'проезд Володарского',
  'Пр.джамбула': 'проезд Джамбула',
  'Пр.дусухомбетова': 'проезд Дусухомбетова',
  'Пр.кожевенная': 'проезд Кожевенный',
  'Пр.мусрепова': 'проезд Мусрепова',
  'Пр.пионер-я': 'проезд Пионерский',
  'Пр.садовый.': 'проезд Садовый',
  'Вод-я': 'Водная',
  'Водост-я': 'Водосточная',
  'Волод-о': 'Володарского',
  'Дусух-ва': 'Дусухомбетова',
  'Интер-ая': 'Интернациональная',
  'Интер-я': 'Интернациональная',
  'Партизан-я': 'Партизанская',
  'Первомай-я': 'Первомайская',
  'Пер.мира': 'переулок Мира',
  'Пионер-я': 'Пионерская',
  'Студен-я': 'Студенческая',
  'Явл.шоссе': 'Яблоневое шоссе',
};

// Функция нормализации названия улицы
function normalizeStreet(street: string): string {
  if (!street) return '';
  
  let normalized = street.trim();
  
  if (STREET_NORMALIZER[normalized]) {
    return STREET_NORMALIZER[normalized];
  }
  
  // Дополнительные исправления
  normalized = normalized
    .replace(/^(\\d+)\\s*к-ный\\s*пр/, '$1-й кольцевой проезд')
    .replace(/^(\\d+)\\s*к-ный\\s*проезд/, '$1-й кольцевой проезд')
    .replace(/(\\d+)-ая\\s+вод-я/, '$1-я Водная')
    .replace(/(\\d+)-я\\s+первомай-я/, '$1-я Первомайская')
    .replace(/(\\d+)вод-я/, '$1-я Водная')
    .replace(/(\\d+)первомайская/, '$1-я Первомайская');
  
  return normalized;
}

// Функция нормализации материала стен
function normalizeWallMaterial(material: string): string | null {
  if (!material) return null;
  
  const materialMap: Record<string, string> = {
    'Кирпич': 'Кирпич',
    'Панель': 'Панель',
    'Кирпич-панель': 'Кирпич-панель', 
    'Кирпич-блок': 'Кирпич-блок',
    'Панель-кирпич': 'Панель-кирпич',
    'Шлакоблок': 'Шлакоблок',
    'Силикатный щит': 'Силикатный щит',
    'Дерево': 'Дерево',
    'Дерево-кирпич': 'Дерево-кирпич',
    'Дерево-блок': 'Дерево-блок',
    'Брус': 'Дерево',
    'Блок': 'Блок',
    'СВП': 'СВП',
    'Монолит': 'Монолит',
    'Щитовое здание': 'Щитовое',
    'Шлакопанель': 'Шлакопанель'
  };
  
  const trimmed = material.trim();
  return materialMap[trimmed] || trimmed;
}

// Функция определения уровня достоверности
function getConfidenceLevel(dataSource: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (!dataSource) return 'LOW';
  
  if (dataSource.includes('base+2gis+internet_search')) return 'HIGH';
  if (dataSource.includes('base+2gis')) return 'HIGH';
  if (dataSource.includes('base+internet_search')) return 'MEDIUM';
  if (dataSource.includes('typical_data')) return 'LOW';
  if (dataSource === 'base') return 'MEDIUM';
  
  return 'MEDIUM';
}

// Интерфейс для CSV строки
interface CSVRow {
  full_address: string;
  street: string;
  house_number: string;
  floors: string;
  year_built: string;
  wall_material: string;
  entrance_count: string;
  coordinates: string;
  data_source: string;
  confidence_level: string;
}

// POST - импорт данных из CSV
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Файл не предоставлен' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Файл должен быть в формате CSV' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const results: any[] = [];
    const errors: any[] = [];
    let processedCount = 0;

    // Парсинг CSV
    const parseCSV = () => {
      return new Promise<void>((resolve, reject) => {
        const stream = Readable.from(text);
        
        stream
          .pipe(csv())
          .on('data', (row: CSVRow) => {
            try {
              processedCount++;
              
              // Пропускаем строки с пустыми основными данными
              if (!row.street || !row.house_number) {
                errors.push({
                  row: processedCount,
                  error: 'Отсутствует улица или номер дома',
                  data: row
                });
                return;
              }
              
              const normalizedStreet = normalizeStreet(row.street);
              const houseNumber = row.house_number.trim();
              
              const buildingData = {
                street: normalizedStreet,
                houseNumber: houseNumber,
                fullAddress: `${normalizedStreet}, ${houseNumber}`,
                totalFloors: row.floors ? parseInt(row.floors) : null,
                yearBuilt: row.year_built ? parseInt(row.year_built) : null,
                wallMaterial: normalizeWallMaterial(row.wall_material),
                entranceCount: row.entrance_count ? parseInt(row.entrance_count) : null,
                dataSource: row.data_source || 'unknown',
                confidenceLevel: getConfidenceLevel(row.data_source),
                buildingType: 'жилой',
                hasElevator: row.floors ? parseInt(row.floors) >= 5 : false,
                isVerified: false,
                isActive: true
              };
              
              results.push(buildingData);
              
            } catch (error) {
              errors.push({
                row: processedCount,
                error: (error as Error).message,
                data: row
              });
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    };

    await parseCSV();

    // Получаем или создаем районы
    const districtMap = new Map<string, string>();
    
    // Создаем дефолтный район для Петропавловска
    let defaultDistrict = await prisma.district.findFirst({
      where: { name: 'Петропавловск' }
    });
    
    if (!defaultDistrict) {
      defaultDistrict = await prisma.district.create({
        data: {
          name: 'Петропавловск',
          description: 'Город Петропавловск, Северо-Казахстанская область',
          isActive: true
        }
      });
    }
    
    districtMap.set('default', defaultDistrict.id);

    // Импортируем здания
    const importedBuildings = [];
    const failedBuildings = [];
    
    for (const buildingData of results) {
      try {
        // Проверяем, существует ли здание
        const existingBuilding = await prisma.building.findFirst({
          where: {
            districtId: defaultDistrict.id,
            street: buildingData.street,
            houseNumber: buildingData.houseNumber
          }
        });
        
        if (existingBuilding) {
          // Обновляем существующее здание
          const updatedBuilding = await prisma.building.update({
            where: { id: existingBuilding.id },
            data: {
              fullAddress: buildingData.fullAddress,
              totalFloors: buildingData.totalFloors,
              yearBuilt: buildingData.yearBuilt,
              wallMaterial: buildingData.wallMaterial,
              entranceCount: buildingData.entranceCount,
              dataSource: buildingData.dataSource,
              confidenceLevel: buildingData.confidenceLevel,
              buildingType: buildingData.buildingType,
              hasElevator: buildingData.hasElevator,
              updatedAt: new Date()
            }
          });
          
          importedBuildings.push({ ...updatedBuilding, action: 'updated' });
        } else {
          // Создаем новое здание
          const newBuilding = await prisma.building.create({
            data: {
              ...buildingData,
              districtId: defaultDistrict.id
            }
          });
          
          importedBuildings.push({ ...newBuilding, action: 'created' });
        }
        
      } catch (error) {
        failedBuildings.push({
          building: buildingData,
          error: (error as Error).message
        });
      }
    }

    const response = {
      success: true,
      message: 'Импорт завершен',
      statistics: {
        totalProcessed: processedCount,
        successfulParsing: results.length,
        parsingErrors: errors.length,
        importedBuildings: importedBuildings.length,
        failedImports: failedBuildings.length,
        created: importedBuildings.filter(b => b.action === 'created').length,
        updated: importedBuildings.filter(b => b.action === 'updated').length
      },
      importedBuildings,
      errors: {
        parsingErrors: errors,
        importErrors: failedBuildings
      }
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Ошибка при импорте зданий:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - получение статистики по зданиям
export async function GET() {
  try {
    const statistics = await prisma.building.groupBy({
      by: ['wallMaterial', 'confidenceLevel'],
      _count: {
        id: true
      }
    });
    
    const totalBuildings = await prisma.building.count();
    
    const yearStats = await prisma.building.groupBy({
      by: ['yearBuilt'],
      _count: {
        id: true
      },
      where: {
        yearBuilt: {
          not: null
        }
      },
      orderBy: {
        yearBuilt: 'asc'
      }
    });
    
    return NextResponse.json({
      totalBuildings,
      materialStats: statistics.filter(s => s.wallMaterial),
      confidenceStats: statistics,
      yearStats: yearStats.slice(0, 50) // Ограничиваем количество
    });
    
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
}