const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectUsers() {
  try {
    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Всего пользователей в базе: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\nСписок всех пользователей:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} (ID: ${user.id})`);
      });
    } else {
      console.log('В базе данных нет пользователей');
    }
    
    // Проверяем, есть ли пользователь с ID из ошибки
    const userIdFromError = "cmep7ei0q000iey4cp86xb8ku";
    const user = await prisma.user.findUnique({
      where: { id: userIdFromError }
    });
    
    if (user) {
      console.log(`\nПользователь с ID ${userIdFromError} найден:`);
      console.log(`${user.name} (${user.email}) - ${user.role}`);
    } else {
      console.log(`\nПользователь с ID ${userIdFromError} НЕ найден в базе данных`);
    }
    
  } catch (error) {
    console.error('Ошибка при получении данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectUsers();