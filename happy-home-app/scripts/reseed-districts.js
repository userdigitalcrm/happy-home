const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Полный список районов Петропавловска
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

async function seedDistricts() {
  console.log('🌱 Seeding districts...');

  try {
    // Create districts sequentially to avoid connection pool timeout
    const districts = [];
    
    for (const name of districtNames) {
      try {
        const district = await prisma.district.upsert({
          where: { name },
          update: {},
          create: { 
            name, 
            description: `${name} район`,
            isActive: true
          }
        });
        
        districts.push(district);
        console.log(`✅ Created/updated district: ${name}`);
      } catch (error) {
        console.error(`❌ Error creating district ${name}:`, error.message);
      }
    }

    console.log(`✅ Successfully processed ${districts.length} districts`);

  } catch (error) {
    console.error('❌ Error seeding districts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDistricts();