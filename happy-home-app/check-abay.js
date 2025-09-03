const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAbayStreets() {
  try {
    // Проверим, есть ли здания на улице Абая
    const abayBuildings = await prisma.building.findMany({
      where: {
        street: {
          contains: 'Абая'
        }
      },
      include: {
        district: true
      }
    });
    
    console.log('Найдено зданий на улице Абая:', abayBuildings.length);
    abayBuildings.forEach(b => console.log(b.fullAddress, '-', b.district.name));
    
    // Проверим, есть ли здания с полным адресом, содержащим "Абая"
    const abayFullAddressBuildings = await prisma.building.findMany({
      where: {
        fullAddress: {
          contains: 'Абая'
        }
      },
      include: {
        district: true
      }
    });
    
    console.log('\nНайдено зданий с полным адресом, содержащим "Абая":', abayFullAddressBuildings.length);
    abayFullAddressBuildings.forEach(b => console.log(b.fullAddress, '-', b.district.name));
    
    // Проверим, есть ли здания на проспекте Абая
    const abayProspectBuildings = await prisma.building.findMany({
      where: {
        OR: [
          { street: { contains: 'Абая' } },
          { street: { contains: 'Абай' } },
          { fullAddress: { contains: 'Абая' } },
          { fullAddress: { contains: 'Абай' } }
        ]
      },
      include: {
        district: true
      }
    });
    
    console.log('\nНайдено зданий с улицей/проспектом Абая/Абай:', abayProspectBuildings.length);
    abayProspectBuildings.forEach(b => console.log(b.fullAddress, '-', b.district.name));
    
  } catch (error) {
    console.error('Ошибка при поиске зданий:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAbayStreets();