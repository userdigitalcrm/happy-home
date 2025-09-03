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

async function compareSearches() {
  try {
    console.log('Сравнение поиска "Абая" и "Конституции Казахстана"');
    
    // Анализируем "Абая"
    const abayQuery = 'Абая';
    const abaySearchTerm = abayQuery.toLowerCase().trim();
    console.log('\nАнализ "Абая":');
    console.log('Исходный запрос:', abayQuery);
    console.log('Поисковый термин:', abaySearchTerm);
    
    // Проверим поиск по "абая" в базе
    const abayResults = await prisma.building.findMany({
      where: {
        OR: [
          {
            street: {
              contains: abaySearchTerm // "абая"
            }
          },
          {
            fullAddress: {
              contains: abaySearchTerm // "абая"
            }
          }
        ],
        AND: [
          { isActive: true }
        ]
      },
      take: 3
    });
    
    console.log('Результаты поиска по "абая":', abayResults.length);
    
    // Проверим поиск по "Абая" (с большой буквы)
    const abayResultsUpper = await prisma.building.findMany({
      where: {
        OR: [
          {
            street: {
              contains: 'Абая'
            }
          },
          {
            fullAddress: {
              contains: 'Абая'
            }
          }
        ],
        AND: [
          { isActive: true }
        ]
      },
      take: 3
    });
    
    console.log('Результаты поиска по "Абая":', abayResultsUpper.length);
    
    // Анализируем "Конституции Казахстана"
    const constitQuery = 'Конституции Казахстана';
    const constitSearchTerm = constitQuery.toLowerCase().trim();
    console.log('\nАнализ "Конституции Казахстана":');
    console.log('Исходный запрос:', constitQuery);
    console.log('Поисковый термин:', constitSearchTerm);
    
    // Проверим поиск по "конституции казахстана" в базе
    const constitResults = await prisma.building.findMany({
      where: {
        OR: [
          {
            street: {
              contains: constitSearchTerm // "конституции казахстана"
            }
          },
          {
            fullAddress: {
              contains: constitSearchTerm // "конституции казахстана"
            }
          }
        ],
        AND: [
          { isActive: true }
        ]
      },
      take: 3
    });
    
    console.log('Результаты поиска по "конституции казахстана":', constitResults.length);
    
    // Проверим поиск по "Конституции Казахстана" (с большой буквы)
    const constitResultsUpper = await prisma.building.findMany({
      where: {
        OR: [
          {
            street: {
              contains: 'Конституции Казахстана'
            }
          },
          {
            fullAddress: {
              contains: 'Конституции Казахстана'
            }
          }
        ],
        AND: [
          { isActive: true }
        ]
      },
      take: 3
    });
    
    console.log('Результаты поиска по "Конституции Казахстана":', constitResultsUpper.length);
    
  } catch (error) {
    console.error('Ошибка при сравнении поисков:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareSearches();