const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSearch() {
  try {
    // Тестируем поиск как в API
    const query = 'Абая';
    const limit = 10;
    
    const searchTerm = query.toLowerCase().trim();
    
    // Общий поиск по всем полям как в API
    const whereClause = {
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
    
    console.log('Результаты поиска по "Абая":');
    console.log('Найдено:', buildings.length);
    buildings.forEach((b, i) => {
      console.log(`${i+1}. ${b.fullAddress} - ${b.district.name}`);
    });
    
    // Проверим также поиск по "Конституции"
    const query2 = 'Конституции';
    const searchTerm2 = query2.toLowerCase().trim();
    
    const whereClause2 = {
      OR: [
        {
          fullAddress: {
            contains: searchTerm2
          }
        },
        {
          street: {
            contains: searchTerm2
          }
        },
        {
          houseNumber: {
            contains: searchTerm2
          }
        }
      ],
      AND: [
        { isActive: true }
      ]
    };
    
    const buildings2 = await prisma.building.findMany({
      where: whereClause2,
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
    
    console.log('\nРезультаты поиска по "Конституции":');
    console.log('Найдено:', buildings2.length);
    buildings2.forEach((b, i) => {
      console.log(`${i+1}. ${b.fullAddress} - ${b.district.name}`);
    });
    
  } catch (error) {
    console.error('Ошибка при тестировании поиска:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSearch();