const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDistricts() {
  try {
    const districts = await prisma.district.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`Всего районов в базе: ${districts.length}`);
    console.log('Список районов:');
    districts.forEach((district, index) => {
      console.log(`${index + 1}. ${district.name}`);
    });
  } catch (error) {
    console.error('Ошибка при получении списка районов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDistricts();