const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('Создание пользователей...');

    // Create default admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@happyhome.kz' },
      update: {},
      create: {
        email: 'admin@happyhome.kz',
        name: 'Администратор',
        role: 'ADMIN',
        isActive: true
      }
    });
    console.log('✅ Администратор создан:', adminUser.email, `(ID: ${adminUser.id})`);

    // Create sample manager user
    const managerUser = await prisma.user.upsert({
      where: { email: 'manager@happyhome.kz' },
      update: {},
      create: {
        email: 'manager@happyhome.kz',
        name: 'Менеджер',
        role: 'MANAGER',
        isActive: true
      }
    });
    console.log('✅ Менеджер создан:', managerUser.email, `(ID: ${managerUser.id})`);

    // Create sample agent user
    const agentUser = await prisma.user.upsert({
      where: { email: 'agent@happyhome.kz' },
      update: {},
      create: {
        email: 'agent@happyhome.kz',
        name: 'Агент',
        role: 'AGENT',
        isActive: true
      }
    });
    console.log('✅ Агент создан:', agentUser.email, `(ID: ${agentUser.id})`);

    console.log('\nВсе пользователи успешно созданы!');
    
    // Проверяем всех пользователей
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`\nВсего пользователей в базе: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} (ID: ${user.id})`);
    });
    
  } catch (error) {
    console.error('Ошибка при создании пользователей:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();