import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - поиск зданий по адресу
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const street = searchParams.get('street');
    const houseNumber = searchParams.get('houseNumber');
    const districtId = searchParams.get('districtId');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Если указаны конкретная улица и номер дома
    if (street && houseNumber) {
      const exactMatch = await prisma.building.findMany({
        where: {
          street: {
            contains: street
          },
          houseNumber: {
            contains: houseNumber
          },
          ...(districtId && { districtId }),
          isActive: true
        },
        include: {
          district: true
        },
        take: 1
      });
      
      return NextResponse.json({
        buildings: exactMatch,
        total: exactMatch.length,
        searchType: 'exact'
      });
    }
    
    // Поиск по общему запросу
    if (query) {
      const searchTerm = query.toLowerCase().trim();
      
      // Разбираем запрос на части (улица и номер дома)
      const addressParts = parseAddress(searchTerm);
      
      let whereClause: any = {
        isActive: true
      };
      
      // Добавляем фильтр по району, если указан
      if (districtId) {
        whereClause.districtId = districtId;
      }
      
      if (addressParts.street && addressParts.houseNumber) {
        // Если удалось выделить улицу и номер дома
        whereClause = {
          AND: [
            {
              OR: [
                {
                  street: {
                    contains: addressParts.street
                  }
                },
                {
                  street: {
                    contains: capitalizeFirstLetter(addressParts.street)
                  }
                },
                {
                  fullAddress: {
                    contains: addressParts.street
                  }
                },
                {
                  fullAddress: {
                    contains: capitalizeFirstLetter(addressParts.street)
                  }
                }
              ]
            },
            {
              houseNumber: {
                contains: addressParts.houseNumber
              }
            },
            { isActive: true },
            ...(districtId ? [{ districtId }] : [])
          ]
        };
      } else if (addressParts.street) {
        // Если только улица
        whereClause = {
          OR: [
            {
              street: {
                contains: addressParts.street
              }
            },
            {
              street: {
                contains: capitalizeFirstLetter(addressParts.street)
              }
            },
            {
              fullAddress: {
                contains: addressParts.street
              }
            },
            {
              fullAddress: {
                contains: capitalizeFirstLetter(addressParts.street)
              }
            }
          ],
          AND: [
            { isActive: true },
            ...(districtId ? [{ districtId }] : [])
          ]
        };
      } else {
        // Общий поиск по всем полям
        whereClause = {
          OR: [
            {
              fullAddress: {
                contains: searchTerm
              }
            },
            {
              fullAddress: {
                contains: capitalizeFirstLetter(searchTerm)
              }
            },
            {
              street: {
                contains: searchTerm
              }
            },
            {
              street: {
                contains: capitalizeFirstLetter(searchTerm)
              }
            },
            {
              houseNumber: {
                contains: searchTerm
              }
            }
          ],
          AND: [
            { isActive: true },
            ...(districtId ? [{ districtId }] : [])
          ]
        };
      }
      
      const buildings = await prisma.building.findMany({
        where: whereClause,
        include: {
          district: true
        },
        orderBy: [
          {
            confidenceLevel: 'desc' // Сначала более достоверные данные
          },
          {
            fullAddress: 'asc'
          }
        ],
        take: limit
      });
      
      return NextResponse.json({
        buildings,
        total: buildings.length,
        searchType: 'query',
        query: searchTerm,
        parsedAddress: addressParts
      });
    }
    
    // Если нет параметров поиска, возвращаем последние добавленные здания
    const whereClause: any = {
      isActive: true
    };
    
    // Добавляем фильтр по району, если указан
    if (districtId) {
      whereClause.districtId = districtId;
    }
    
    const recentBuildings = await prisma.building.findMany({
      where: whereClause,
      include: {
        district: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    return NextResponse.json({
      buildings: recentBuildings,
      total: recentBuildings.length,
      searchType: 'recent'
    });
    
  } catch (error) {
    console.error('Ошибка при поиске зданий:', error);
    return NextResponse.json(
      { error: 'Ошибка при поиске зданий', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Функция для нормализации названия улицы
function normalizeStreet(raw: string): string {
  return raw
    // убираем распространённые сокращения типов улиц (дополнено)
    .replace(/^(ул\.|улица|ул)\s+/i, "")
    .replace(/^(пр-т\.|проспект|пр\.|пр)\s+/i, "")
    .replace(/^(бул\.|бульвар)\s+/i, "")
    .replace(/^(пл\.|площадь)\s+/i, "")
    .replace(/^(пер\.|переулок)\s+/i, "")
    .replace(/^(пр-д\.|проезд|прд)\s+/i, "")
    .replace(/^(шоссе|ш\.|ш)\s+/i, "")
    .replace(/[.,]/g, " ")                     // точки/запятые → пробел
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Обновлённая функция для разбора адреса на компоненты
function parseAddress(address: string): { street?: string; houseNumber?: string } {
  const trimmed = address.trim();
  if (!trimmed) return {};

  // Приводим строку к единому регистру и убираем запятые типа «д.», «к.» и т.п.
  const normalized = trimmed
    .replace(/д\.?/gi, "")
    .replace(/к\.?/gi, "")
    .replace(/корп\.?/gi, "")
    .replace(/стр\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Паттерны для распознавания адресов
  const patterns = [
    // «Улица, номер буква» с пробелом между цифрой и литерой
    /^(.+?)[,\s]+(\d+\s*[\wА-Яа-я-\/]*)$/i,
    // «Улица, номер» или «Улица номер» (допускаем дефис/корпус/литера, без пробела)
    /^(.+?)[,\s]+(\d+\s*[\w-/]*)$/i,
    // «номер Улица» или «10 ул. Ленина» (поддержка пробела между цифрой и буквой)
    /^(\d+\s*[\wА-Яа-я-/]*)\s+(.+)$/i,
    // «Улица, д. 10»
    /^(.+?),?\s*д\.?\s*(\d+\s*[\wА-Яа-я-/]*)$/i,
    // «Улица, дом 10 корпус 1»
    /^(.+?),?\s*дом\s*(\d+\s*[\wА-Яа-я-/]*)$/i,
    // «Улица дом 10» без запятой
    /^(.+?)\s+дом\s+(\d+\s*[\wА-Яа-я-/]*)$/i,
    // Фоллбек: «Улица, 10к1» (корпус, допускаем пробел)
    /^(.+?),?\s*(\d+\s*[\wА-Яа-я-/]*)$/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const [, part1, part2] = match;
      // Если первая часть начинается с цифры — это номер дома
      if (/^\d/.test(part1)) {
        return {
          street: normalizeStreet(part2),
          houseNumber: part1.toLowerCase()
        };
      }
      return {
        street: normalizeStreet(part1),
        houseNumber: part2.toLowerCase()
      };
    }
  }

  // Если не удалось разобрать, считаем все названием улицы
  return {
    street: normalizeStreet(normalized)
  };
}

// Добавим вспомогательную функцию для капитализации первой буквы
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// POST - добавление нового здания в справочник
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      street,
      houseNumber,
      districtId,
      totalFloors,
      yearBuilt,
      wallMaterial,
      entranceCount,
      buildingType,
      hasElevator,
      hasGarbageChute,
      heatingType,
      layout,
      latitude,
      longitude,
      dataSource = 'manual',
      confidenceLevel = 'MEDIUM'
    } = body;
    
    // Валидация обязательных полей
    if (!street || !houseNumber) {
      return NextResponse.json(
        { error: 'Улица и номер дома обязательны' },
        { status: 400 }
      );
    }
    
    if (!districtId) {
      return NextResponse.json(
        { error: 'Район обязателен' },
        { status: 400 }
      );
    }
    
    // Проверяем, существует ли уже такое здание
    const existingBuilding = await prisma.building.findFirst({
      where: {
        districtId,
        street: street.trim(),
        houseNumber: houseNumber.trim()
      }
    });
    
    if (existingBuilding) {
      return NextResponse.json(
        { error: 'Здание с таким адресом уже существует' },
        { status: 409 }
      );
    }
    
    // Создаем новое здание
    const fullAddress = `${street.trim()}, ${houseNumber.trim()}`;
    
    const newBuilding = await prisma.building.create({
      data: {
        districtId,
        street: street.trim(),
        houseNumber: houseNumber.trim(),
        fullAddress,
        totalFloors,
        yearBuilt,
        wallMaterial,
        entranceCount,
        buildingType,
        hasElevator: hasElevator || false,
        hasGarbageChute: hasGarbageChute || false,
        heatingType,
        layout,
        latitude,
        longitude,
        dataSource,
        confidenceLevel,
        isVerified: false,
        isActive: true
      },
      include: {
        district: true
      }
    });
    
    return NextResponse.json({
      success: true,
      building: newBuilding,
      message: 'Здание успешно добавлено в справочник'
    });
    
  } catch (error) {
    console.error('Ошибка при добавлении здания:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении здания', details: (error as Error).message },
      { status: 500 }
    );
  }
}