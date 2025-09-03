const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCaseSensitivity() {
  try {
    // Проверим точное совпадение с "Абая"
    const exactMatch = await prisma.building.findMany({
      where: {
        street: 'Абая'
      },
      take: 3
    });
    
    console.log('Здания с точным совпадением "Абая":', exactMatch.length);
    exactMatch.forEach(b => console.log('- ', b.street));
    
    // Проверим точное совпадение с "абая"
    const exactMatchLower = await prisma.building.findMany({
      where: {
        street: 'абая'
      },
      take: 3
    });
    
    console.log('\nЗдания с точным совпадением "абая":', exactMatchLower.length);
    exactMatchLower.forEach(b => console.log('- ', b.street));
    
    // Проверим поиск с contains и "Абая"
    const containsMatch = await prisma.building.findMany({
      where: {
        street: {
          contains: 'Абая'
        }
      },
      take: 3
    });
    
    console.log('\nЗдания с contains "Абая":', containsMatch.length);
    containsMatch.forEach(b => console.log('- ', b.street));
    
    // Проверим поиск с contains и "абая"
    const containsMatchLower = await prisma.building.findMany({
      where: {
        street: {
          contains: 'абая'
        }
      },
      take: 3
    });
    
    console.log('\nЗдания с contains "абая":', containsMatchLower.length);
    containsMatchLower.forEach(b => console.log('- ', b.street));
    
  } catch (error) {
    console.error('Ошибка при проверке регистрозависимости:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCaseSensitivity();