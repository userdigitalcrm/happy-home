const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Функция нормализации из API
function normalizeStreet(raw) {
  return raw
    .replace(/^(ул\.|улица|ул)\s+/i, "")
    .replace(/^(пр-т\.|проспект|пр\.|пр)\s+/i, "")
    .replace(/^(бул\.|бульвар)\s+/i, "")
    .replace(/^(пл\.|площадь)\s+/i, "")
    .replace(/^(пер\.|переулок)\s+/i, "")
    .replace(/^(пр-д\.|проезд|прд)\s+/i, "")
    .replace(/^(шоссе|ш\.|ш)\s+/i, "")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Функция разбора адреса из API
function parseAddress(address) {
  const trimmed = address.trim();
  if (!trimmed) return {};

  const normalized = trimmed
    .replace(/д\.?/gi, "")
    .replace(/к\.?/gi, "")
    .replace(/корп\.?/gi, "")
    .replace(/стр\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /^(.+?)[,\s]+(\d+\s*[\wА-Яа-я-\/]*)$/i,
    /^(.+?)[,\s]+(\d+\s*[\w-/]*)$/i,
    /^(\d+\s*[\wА-Яа-я-/]*)\s+(.+)$/i,
    /^(.+?),?\s*д\.?\s*(\d+\s*[\wА-Яа-я-/]*)$/i,
    /^(.+?),?\s*дом\s*(\d+\s*[\wА-Яа-я-/]*)$/i,
    /^(.+?)\s+дом\s+(\d+\s*[\wА-Яа-я-/]*)$/i,
    /^(.+?),?\s*(\d+\s*[\wА-Яа-я-/]*)$/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const [, part1, part2] = match;
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

  return {
    street: normalizeStreet(normalized)
  };
}

async function testApiSearch() {
  try {
    const query = 'Абая';
    const limit = 10;
    
    const searchTerm = query.toLowerCase().trim();
    const addressParts = parseAddress(searchTerm);
    
    console.log('Анализ поискового запроса:');
    console.log('searchTerm:', searchTerm);
    console.log('addressParts:', addressParts);
    
    let whereClause = {
      isActive: true
    };
    
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
                fullAddress: {
                  contains: addressParts.street
                }
              }
            ]
          },
          {
            houseNumber: {
              contains: addressParts.houseNumber
            }
          },
          { isActive: true }
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
            fullAddress: {
              contains: addressParts.street
            }
          }
        ],
        AND: [
          { isActive: true }
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
            street: {
              contains: searchTerm
            }
          },
          {
            houseNumber: {
              contains: searchTerm
            }
          }
        ],
        AND: [
          { isActive: true }
        ]
      };
    }
    
    console.log('\nСформированный whereClause:');
    console.log(JSON.stringify(whereClause, null, 2));
    
    const buildings = await prisma.building.findMany({
      where: whereClause,
      include: {
        district: true
      },
      orderBy: [
        {
          confidenceLevel: 'desc'
        },
        {
          fullAddress: 'asc'
        }
      ],
      take: limit
    });
    
    console.log('\nРезультаты поиска:');
    console.log('Найдено зданий:', buildings.length);
    buildings.forEach((b, i) => {
      console.log(`${i+1}. ${b.fullAddress} - ${b.district.name} (street: "${b.street}")`);
    });
    
  } catch (error) {
    console.error('Ошибка при тестировании API поиска:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiSearch();