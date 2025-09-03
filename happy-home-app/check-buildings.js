const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBuildingData() {
  console.log('🔍 Проверка данных в справочнике зданий...\n');

  try {
    // Проверяем все здания на улице Абая
    const abayaBuildings = await prisma.building.findMany({
      where: {
        street: {
          contains: 'Абая',
          mode: 'insensitive'
        }
      },
      include: {
        district: true
      }
    });

    console.log('📍 Здания на улице Абая:');
    if (abayaBuildings.length > 0) {
      abayaBuildings.forEach(building => {
        console.log(`   - ${building.fullAddress}`);
        console.log(`     Год: ${building.yearBuilt || 'не указан'}, Материал: ${building.wallMaterial || 'не указан'}, Этажи: ${building.totalFloors || 'не указано'}`);
        console.log(`     Район: ${building.district.name}`);
      });
    } else {
      console.log('   ❌ Зданий не найдено');
    }

    // Проверяем все здания в базе
    console.log('\n📋 Все здания в справочнике:');
    const allBuildings = await prisma.building.findMany({
      include: {
        district: true
      },
      orderBy: {
        street: 'asc'
      }
    });

    allBuildings.forEach(building => {
      console.log(`   - ${building.fullAddress} (${building.district.name})`);
    });

    console.log(`\n📊 Всего зданий в справочнике: ${allBuildings.length}`);

    // Добавим здание "Абая, 120" для тестирования
    const existingAbaya120 = await prisma.building.findFirst({
      where: {
        street: 'Абая',
        houseNumber: '120'
      }
    });

    if (!existingAbaya120) {
      const petropavlovsk = await prisma.district.findFirst({
        where: { name: 'Петропавловск' }
      });

      if (petropavlovsk) {
        const newBuilding = await prisma.building.create({
          data: {
            districtId: petropavlovsk.id,
            street: 'Абая',
            houseNumber: '120',
            fullAddress: 'Абая, 120',
            totalFloors: 9,
            yearBuilt: 1985,
            wallMaterial: 'Кирпич',
            entranceCount: 4,
            buildingType: 'жилой',
            hasElevator: true,
            dataSource: 'manual',
            confidenceLevel: 'HIGH',
            isVerified: false,
            isActive: true
          }
        });

        console.log(`\n✅ Добавлено здание для тестирования: ${newBuilding.fullAddress}`);
      }
    } else {
      console.log('\n✅ Здание "Абая, 120" уже существует');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBuildingData();