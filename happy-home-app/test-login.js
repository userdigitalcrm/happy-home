const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const email = 'admin@happyhome.kz';
    const password = 'admin123';
    
    console.log(`Тестирование входа для пользователя: ${email}`);
    
    // Имитация функции authorize из auth.ts
    console.log('Поиск пользователя в базе данных...');
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    console.log('✅ Пользователь найден');
    console.log(`Статус активности: ${user.isActive ? 'Активен' : 'Не активен'}`);
    
    if (!user.isActive) {
      console.log('❌ Пользователь не активен');
      return;
    }
    
    if (!user.password) {
      console.log('❌ Пароль не установлен');
      return;
    }
    
    console.log('Проверка пароля...');
    const isValid = await bcrypt.compare(password, user.password);
    
    if (isValid) {
      console.log('✅ Пароль верный! Аутентификация успешна');
    } else {
      console.log('❌ Пароль неверный! Аутентификация не удалась');
    }
    
  } catch (error) {
    console.error('Ошибка при тестировании входа:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();