const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectDistricts() {
  try {
    // Получаем все районы
    const districts = await prisma.district.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`Всего районов в базе: ${districts.length}`);
    
    if (districts.length > 0) {
      console.log('\nСписок всех районов:');
      districts.forEach((district, index) => {
        console.log(`${index + 1}. ${district.name} (ID: ${district.id})`);
      });
    } else {
      console.log('В базе данных нет районов');
    }
    
    // Проверяем, есть ли какие-либо данные в других таблицах
    const categories = await prisma.category.count();
    const buildings = await prisma.building.count();
    const users = await prisma.user.count();
    
    console.log(`\nДругая статистика:`);
    console.log(`- Категорий: ${categories}`);
    console.log(`- Зданий: ${buildings}`);
    console.log(`- Пользователей: ${users}`);
    
  } catch (error) {
    console.error('Ошибка при получении данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDistricts();