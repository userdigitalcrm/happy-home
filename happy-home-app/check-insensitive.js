const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkInsensitiveSearch() {
  try {
    // Проверим, поддерживает ли SQLite регистронезависимый поиск в Prisma
    const results = await prisma.building.findMany({
      where: {
        street: {
          contains: 'АБАЯ',
          mode: 'insensitive'
        }
      },
      take: 3
    });
    
    console.log('Регистронезависимый поиск работает:', results.length);
  } catch (error) {
    console.log('Регистронезависимый поиск не поддерживается:', error.message);
    
    // Попробуем альтернативный подход - использовать OR с разными регистрами
    try {
      const results2 = await prisma.building.findMany({
        where: {
          OR: [
            { street: { contains: 'Абая' } },
            { street: { contains: 'абая' } },
            { fullAddress: { contains: 'Абая' } },
            { fullAddress: { contains: 'абая' } }
          ]
        },
        take: 3
      });
      
      console.log('Альтернативный подход работает:', results2.length);
    } catch (error2) {
      console.log('Альтернативный подход тоже не работает:', error2.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkInsensitiveSearch();