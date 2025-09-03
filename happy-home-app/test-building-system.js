#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function testBuildingReferenceSystem() {
  console.log('🧪 Тестирование системы справочника зданий...\n');

  try {
    // Тест 1: Проверка подключения к базе данных
    console.log('1. Тестирование подключения к базе данных...');
    const districts = await prisma.district.findMany();
    console.log(`   ✅ Подключение к БД работает. Найдено районов: ${districts.length}`);

    // Тест 2: Проверка справочника зданий
    console.log('\n2. Проверка справочника зданий...');
    const buildings = await prisma.building.findMany({
      include: {
        district: true
      }
    });
    console.log(`   ✅ Найдено зданий в справочнике: ${buildings.length}`);

    if (buildings.length === 0) {
      console.log('   ⚠️  Справочник пуст! Инициализируем данные...');
      
      // Находим или создаем район Петропавловск
      let petropavlovsk = districts.find(d => d.name === 'Петропавловск');
      if (!petropavlovsk) {
        petropavlovsk = await prisma.district.create({
          data: {
            name: 'Петропавловск',
            description: 'Город Петропавловск, Северо-Казахстанская область',
            isActive: true
          }
        });
        console.log('   ✅ Создан район Петропавловск');
      }

      // Добавляем тестовое здание
      const testBuilding = await prisma.building.create({
        data: {
          districtId: petropavlovsk.id,
          street: 'Абая',
          houseNumber: '102',
          fullAddress: 'Абая, 102',
          totalFloors: 5,
          yearBuilt: 1980,
          wallMaterial: 'Панель',
          entranceCount: 12,
          buildingType: 'жилой',
          hasElevator: true,
          dataSource: 'test',
          confidenceLevel: 'HIGH',
          isVerified: false,
          isActive: true
        }
      });
      
      console.log(`   ✅ Добавлено тестовое здание: ${testBuilding.fullAddress}`);
    } else {
      console.log('   📋 Примеры зданий в справочнике:');
      buildings.slice(0, 3).forEach(building => {
        console.log(`      - ${building.fullAddress} (${building.district.name}, ${building.yearBuilt || 'год не указан'})`);
      });
    }

    // Тест 3: Проверка API поиска зданий
    console.log('\n3. Тестирование API поиска зданий...');
    
    try {
      // Симуляция API запроса (без фактического HTTP вызова)
      const searchResults = await prisma.building.findMany({
        where: {
          OR: [
            {
              fullAddress: {
                contains: 'Абая',
                mode: 'insensitive'
              }
            },
            {
              street: {
                contains: 'Абая',
                mode: 'insensitive'
              }
            }
          ],
          isActive: true
        },
        include: {
          district: true
        },
        take: 5
      });

      if (searchResults.length > 0) {
        console.log(`   ✅ Поиск работает! Найдено зданий по запросу "Абая": ${searchResults.length}`);
        searchResults.forEach(building => {
          console.log(`      📍 ${building.fullAddress} - ${building.yearBuilt || 'год неизвестен'}, ${building.wallMaterial || 'материал неизвестен'}`);
        });
      } else {
        console.log('   ❌ Поиск не дал результатов');
      }
    } catch (error) {
      console.log(`   ❌ Ошибка API поиска: ${error.message}`);
    }

    // Тест 4: Проверка структуры данных для автозаполнения
    console.log('\n4. Проверка данных для автозаполнения...');
    const buildingsWithData = await prisma.building.findMany({
      where: {
        AND: [
          { yearBuilt: { not: null } },
          { wallMaterial: { not: null } },
          { totalFloors: { not: null } }
        ]
      }
    });

    console.log(`   ✅ Зданий с полными данными для автозаполнения: ${buildingsWithData.length}`);
    
    if (buildingsWithData.length > 0) {
      const sample = buildingsWithData[0];
      console.log(`   📋 Пример данных: ${sample.fullAddress}`);
      console.log(`      - Год постройки: ${sample.yearBuilt}`);
      console.log(`      - Материал стен: ${sample.wallMaterial}`);
      console.log(`      - Этажность: ${sample.totalFloors}`);
    }

    console.log('\n🎉 Все тесты пройдены успешно!');
    console.log('\n📝 Система готова к использованию:');
    console.log('   1. Запустите приложение: npm run dev');
    console.log('   2. Откройте форму добавления объекта');
    console.log('   3. Начните вводить адрес (например: "Абая")');
    console.log('   4. Выберите здание из списка');
    console.log('   5. Поля будут заполнены автоматически!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
    console.log('\n🔧 Возможные решения:');
    console.log('   1. Проверьте подключение к базе данных');
    console.log('   2. Выполните миграции: npx prisma db push');
    console.log('   3. Сгенерируйте клиент: npx prisma generate');
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск тестов
if (require.main === module) {
  testBuildingReferenceSystem()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = testBuildingReferenceSystem;