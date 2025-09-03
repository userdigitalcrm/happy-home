const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

console.log('Подробная проверка пользователей в базе данных...');

// Открываем базу данных
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Ошибка открытия базы данных:', err.message);
    return;
  }
  console.log('Успешное подключение к базе данных\n');
});

// Проверяем всех пользователей с подробной информацией
db.serialize(() => {
  db.all('SELECT * FROM users', (err, users) => {
    if (err) {
      console.error('Ошибка получения данных из таблицы users:', err.message);
      return;
    }
    
    console.log('Все пользователи в базе данных:');
    console.log('====================================');
    
    if (users.length === 0) {
      console.log('Таблица users пуста');
    } else {
      users.forEach((user, index) => {
        console.log(`Пользователь ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Имя: ${user.name || 'Не указано'}`);
        console.log(`  Роль: ${user.role}`);
        console.log(`  Активен: ${user.isActive ? 'Да' : 'Нет'}`);
        console.log(`  Дата создания: ${user.createdAt}`);
        console.log(`  Дата последнего входа: ${user.lastLoginAt || 'Никогда'}`);
        console.log('------------------------------------');
      });
    }
    
    // Закрываем соединение с базой данных
    db.close((err) => {
      if (err) {
        console.error('Ошибка закрытия базы данных:', err.message);
      } else {
        console.log('Соединение с базой данных закрыто');
      }
    });
  });
});