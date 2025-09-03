const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 Начинаем ручное заполнение базы данных...');
  
  try {
    // Создаем категории недвижимости
    console.log('Создаем категории недвижимости...');
    const categories = [
      { name: '1 Ком', description: '1-комнатная квартира' },
      { name: '2 Ком', description: '2-комнатная квартира' },
      { name: '3 Ком', description: '3-комнатная квартира' },
      { name: '4 Ком', description: '4-комнатная квартира' },
      { name: '5 Ком', description: '5-комнатная квартира' },
      { name: '6 Ком', description: '6-комнатная квартира' },
      { name: 'РИЭЛТОР', description: 'Коммерческая недвижимость' },
    ];

    for (const categoryData of categories) {
      try {
        const category = await prisma.category.create({
          data: categoryData,
        });
        console.log(`✅ Создана категория: ${category.name}`);
      } catch (error) {
        console.log(`ℹ️  Категория ${categoryData.name} уже существует или ошибка: ${error.message}`);
      }
    }

    // Создаем районы Петропавловска
    console.log('Создаем районы Петропавловска...');
    const districtNames = [
      'Вокзал', 'Подгора', 'Рахмет', '20 Мкр', 'Колхозный', 'Бензострой',
      '2 Гор Бол', 'Скиф', 'ДБС', 'ВВИ', 'Северный', 'Рабочий',
      '19 Мкр', 'Азия', 'Буратино', 'Горотдел', 'ДСР', 'Уют',
      'Океан', '8 Школа', 'ДОБ', 'Дельфин', '17 Школа', 'Новый ЦОТ',
      'Сокол', 'Атлантида', 'Тайга', 'Берёзка', '3 Гор Бол', 'Черемушки',
      'Казахтелеком', 'Мастер', 'ЦОН', 'Дошкольник', 'Рахат', 'Новая Мечеть',
      'Бэст', '3 Баня', 'СКГУ', 'Ахтамар', 'Динамо', 'Радужный',
      'Мясокомбинат', 'Борки', 'Старт', 'Драм Театр Погодина', 'Достык Молл',
      '7 Школа', 'Гор Парк'
    ];

    for (const name of districtNames) {
      try {
        const district = await prisma.district.create({
          data: { 
            name, 
            description: `${name} район`,
            isActive: true
          }
        });
        console.log(`✅ Создан район: ${district.name}`);
      } catch (error) {
        console.log(`ℹ️  Район ${name} уже существует или ошибка: ${error.message}`);
      }
    }

    // Получаем все районы для использования в зданиях
    const districts = await prisma.district.findMany();
    console.log(`ℹ️  Найдено ${districts.length} районов`);
    
    // Создаем тестовые здания с справочными данными
    console.log('Создаем тестовые здания...');
    if (districts.length > 0) {
      const buildingData = {
        districtId: districts[0].id,
        street: 'Конституции Казахстана',
        houseNumber: '1',
        fullAddress: 'Конституции Казахстана, 1',
        yearBuilt: 1985,
        wallMaterial: 'Кирпич',
        layout: 'Улучшенная',
        totalFloors: 9,
        hasElevator: true,
        heatingType: 'Центральное',
        confidenceLevel: 'HIGH',
        dataSource: 'base',
        isVerified: true,
        isActive: true
      };

      try {
        const building = await prisma.building.create({
          data: buildingData,
        });
        console.log(`✅ Создано здание: ${building.fullAddress}`);
      } catch (error) {
        console.log(`ℹ️  Здание уже существует или ошибка: ${error.message}`);
      }
    }

    // Создаем администратора
    console.log('Создаем пользователя-администратора...');
    try {
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@happyhome.kz',
          name: 'Администратор',
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log(`✅ Создан пользователь-администратор: ${adminUser.email}`);
    } catch (error) {
      console.log(`ℹ️  Пользователь-администратор уже существует или ошибка: ${error.message}`);
    }

    console.log('🎉 Ручное заполнение базы данных завершено!');

  } catch (error) {
    console.error('❌ Ошибка при ручном заполнении базы данных:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Подключение закрыто');
  }
}

main();