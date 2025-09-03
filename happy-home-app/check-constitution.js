const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkConstitutionSearch() {
  try {
    // Проверим, есть ли здания с "Конституции" в названии улицы
    const constitutionStreets = await prisma.building.findMany({
      where: {
        street: {
          contains: 'Конституции'
        }
      },
      include: {
        district: true
      }
    });
    
    console.log('Здания с "Конституции" в названии улицы:', constitutionStreets.length);
    constitutionStreets.forEach(b => console.log('- ', b.fullAddress, '-', b.district.name));
    
    // Проверим, есть ли здания с "Конституции" в полном адресе
    const constitutionFullAddress = await prisma.building.findMany({
      where: {
        fullAddress: {
          contains: 'Конституции'
        }
      },
      include: {
        district: true
      }
    });
    
    console.log('\nЗдания с "Конституции" в полном адресе:', constitutionFullAddress.length);
    constitutionFullAddress.forEach(b => console.log('- ', b.fullAddress, '-', b.district.name));
    
    // Проверим, как хранится "Конституции" - с большой или маленькой буквы
    const allStreets = await prisma.building.findMany({
      where: {
        OR: [
          { street: { contains: 'Конституции' } },
          { street: { contains: 'конституции' } }
        ]
      },
      select: {
        street: true
      },
      distinct: ['street']
    });
    
    console.log('\nВсе уникальные улицы с "Конституции":');
    allStreets.forEach(s => console.log('- ', s.street));
    
  } catch (error) {
    console.error('Ошибка при проверке поиска по Конституции:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConstitutionSearch();