const { PrismaClient } = require('@prisma/client');

// Устанавливаем логирование для отладки
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    console.log('🔍 Проверяем подключение к базе данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных успешно установлено');
    
    // Проверяем наличие таблиц, выполняя простой запрос
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 Таблицы в базе данных:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Проверяем количество записей в каждой таблице
    console.log('\n📊 Количество записей в таблицах:');
    
    try {
      const categoryCount = await prisma.category.count();
      console.log(`  Категории: ${categoryCount}`);
    } catch (error) {
      console.log('  Категории: таблица не существует или пуста');
    }
    
    try {
      const districtCount = await prisma.district.count();
      console.log(`  Районы: ${districtCount}`);
    } catch (error) {
      console.log('  Районы: таблица не существует или пуста');
    }
    
    try {
      const buildingCount = await prisma.building.count();
      console.log(`  Здания: ${buildingCount}`);
    } catch (error) {
      console.log('  Здания: таблица не существует или пуста');
    }
    
    try {
      const userCount = await prisma.user.count();
      console.log(`  Пользователи: ${userCount}`);
    } catch (error) {
      console.log('  Пользователи: таблица не существует или пуста');
    }
    
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);
    console.error('Подробности:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Подключение закрыто');
  }
}

main();