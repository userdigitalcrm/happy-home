const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

console.log('Тестирование аутентификации...');

// Открываем базу данных
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Ошибка открытия базы данных:', err.message);
    return;
  }
  console.log('Успешное подключение к базе данных\n');
});

// Тестовые данные
const testEmail = 'vadimexpert95@gmail.com';
const testPassword = 'ваш_пароль'; // Замените на правильный пароль

console.log(`Проверка пользователя с email: ${testEmail}`);

// Проверяем пользователя
db.serialize(() => {
  db.get('SELECT * FROM users WHERE email = ?', [testEmail], (err, user) => {
    if (err) {
      console.error('Ошибка получения данных пользователя:', err.message);
      return;
    }
    
    if (!user) {
      console.log('Пользователь не найден');
      db.close();
      return;
    }
    
    console.log('Пользователь найден:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Активен: ${user.isActive ? 'Да' : 'Нет'}`);
    console.log(`  Хэш пароля: ${user.password}`);
    
    if (!user.isActive) {
      console.log('Пользователь не активен!');
      db.close();
      return;
    }
    
    if (!user.password) {
      console.log('Пароль не установлен!');
      db.close();
      return;
    }
    
    // Проверяем пароль
    console.log('\nПроверка пароля...');
    bcrypt.compare(testPassword, user.password, (err, isMatch) => {
      if (err) {
        console.error('Ошибка проверки пароля:', err.message);
        db.close();
        return;
      }
      
      if (isMatch) {
        console.log('✅ Пароль верный!');
      } else {
        console.log('❌ Пароль неверный!');
        console.log('Попробуйте другой пароль.');
      }
      
      db.close((err) => {
        if (err) {
          console.error('Ошибка закрытия базы данных:', err.message);
        } else {
          console.log('\nСоединение с базой данных закрыто');
        }
      });
    });
  });
});