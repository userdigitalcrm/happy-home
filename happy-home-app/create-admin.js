const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@happyhome.kz';
    const password = 'admin123'; // Простой пароль для тестирования
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Создание администратора...');
    console.log(`Email: ${email}`);
    console.log(`Пароль: ${password}`);
    console.log(`Хэш пароля: ${hashedPassword}`);
    
    const admin = await prisma.user.create({
      data: {
        email: email,
        name: 'Администратор',
        role: 'ADMIN',
        password: hashedPassword,
        isActive: true
      }
    });
    
    console.log('✅ Администратор успешно создан!');
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Роль: ${admin.role}`);
    
  } catch (error) {
    console.error('Ошибка при создании администратора:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();