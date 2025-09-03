const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

console.log('Проверка хэширования пароля...');

// Открываем базу данных
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Ошибка открытия базы данных:', err.message);
    return;
  }
  console.log('Успешное подключение к базе данных\n');
});

// Проверяем пароль пользователя
db.serialize(() => {
  db.all('SELECT id, email, password FROM users WHERE email = ?', ['vadimexpert95@gmail.com'], (err, users) => {
    if (err) {
      console.error('Ошибка получения данных пользователя:', err.message);
      return;
    }
    
    if (users.length === 0) {
      console.log('Пользователь не найден');
      return;
    }
    
    const user = users[0];
    console.log('Информация о пользователе:');
    console.log(`Email: ${user.email}`);
    console.log(`Хэш пароля: ${user.password}`);
    console.log(`Длина хэша: ${user.password ? user.password.length : 0}`);
    
    // Проверяем, является ли хэш действительным bcrypt хэшем
    if (user.password) {
      const isValidHash = bcrypt.hashSync('test', 10); // Создаем тестовый хэш
      console.log(`Формат хэша правильный: ${user.password.startsWith('$2')}`);
      
      // Попробуем проверить пароль (если вы знаете правильный пароль)
      // const isMatch = bcrypt.compareSync('ваш_пароль', user.password);
      // console.log(`Пароль совпадает: ${isMatch}`);
    } else {
      console.log('Пароль не установлен');
    }
    
    // Закрываем соединение с базой данных
    db.close((err) => {
      if (err) {
        console.error('Ошибка закрытия базы данных:', err.message);
      } else {
        console.log('\nСоединение с базой данных закрыто');
      }
    });
  });
});