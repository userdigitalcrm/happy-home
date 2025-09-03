const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

console.log('Проверка содержимого базы данных SQLite...');
console.log('Путь к базе данных:', dbPath);

// Открываем базу данных
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Ошибка открытия базы данных:', err.message);
    return;
  }
  console.log('Успешное подключение к базе данных');
});

// Проверяем таблицы в базе данных
db.serialize(() => {
  // Получаем список таблиц
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Ошибка получения списка таблиц:', err.message);
      return;
    }
    
    console.log('\nТаблицы в базе данных:');
    tables.forEach(table => {
      console.log('- ' + table.name);
    });
    
    // Проверяем содержимое таблицы пользователей
    db.all('SELECT * FROM users LIMIT 10', (err, users) => {
      if (err) {
        console.error('Ошибка получения данных из таблицы users:', err.message);
        return;
      }
      
      console.log('\nПользователи в базе данных (первые 10):');
      if (users.length === 0) {
        console.log('Таблица users пуста');
      } else {
        users.forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}, Роль: ${user.role}, Активен: ${user.isActive}`);
        });
      }
      
      // Проверяем содержимое таблицы зданий
      db.all('SELECT * FROM buildings LIMIT 5', (err, buildings) => {
        if (err) {
          console.error('Ошибка получения данных из таблицы buildings:', err.message);
          return;
        }
        
        console.log('\nЗдания в базе данных (первые 5):');
        if (buildings.length === 0) {
          console.log('Таблица buildings пуста');
        } else {
          buildings.forEach((building, index) => {
            console.log(`${index + 1}. Улица: ${building.street}, Номер дома: ${building.houseNumber}, Район ID: ${building.districtId}`);
          });
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
  });
});