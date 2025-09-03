const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к базе данных SQLite
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

// Открываем соединение с базой данных
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка при открытии базы данных:', err.message);
    process.exit(1);
  }
  console.log('Соединение с базой данных SQLite установлено.');
  console.log(`Путь к базе данных: ${dbPath}`);
});

// Анализ схемы таблиц
console.log('Анализ схемы таблицы properties:');

// Получаем информацию о структуре таблицы properties
db.all(`PRAGMA table_info(properties)`, [], (err, columns) => {
  if (err) {
    console.error('Ошибка при получении информации о таблице:', err.message);
    db.close();
    return;
  }
  
  console.log('\nСтруктура таблицы properties:');
  console.log('-----------------------------');
  columns.forEach(column => {
    const notNull = column.notnull === 1 ? 'NOT NULL' : 'NULL';
    const defaultValue = column.dflt_value !== null ? `DEFAULT ${column.dflt_value}` : '';
    const pk = column.pk === 1 ? 'PRIMARY KEY' : '';
    console.log(`${column.name}: ${column.type} ${notNull} ${defaultValue} ${pk}`);
  });
  console.log('-----------------------------');
  
  // Проверяем внешние ключи
  db.all(`PRAGMA foreign_key_list(properties)`, [], (err, foreignKeys) => {
    if (err) {
      console.error('Ошибка при получении информации о внешних ключах:', err.message);
      db.close();
      return;
    }
    
    console.log('\nВнешние ключи таблицы properties:');
    console.log('-----------------------------');
    foreignKeys.forEach(fk => {
      console.log(`${fk.from} -> ${fk.table}(${fk.to}) [${fk.on_update}/${fk.on_delete}]`);
    });
    console.log('-----------------------------');
    
    // Сравнение с схемой Prisma
    console.log('\nРезультат сравнения с схемой Prisma:');
    console.log('-----------------------------');
    
    // Проверяем наличие полей districtId и buildingId и их ограничения
    const districtIdColumn = columns.find(c => c.name === 'districtId');
    const buildingIdColumn = columns.find(c => c.name === 'buildingId');
    
    if (!districtIdColumn) {
      console.log('❌ Поле districtId отсутствует в таблице!');
    } else {
      console.log(`${districtIdColumn.notnull === 1 ? '❌' : '✅'} districtId ${districtIdColumn.notnull === 1 ? 'требует NOT NULL, но должно быть необязательным' : 'корректно настроено как необязательное'}`);
    }
    
    if (!buildingIdColumn) {
      console.log('❌ Поле buildingId отсутствует в таблице!');
    } else {
      console.log(`${buildingIdColumn.notnull === 1 ? '❌' : '✅'} buildingId ${buildingIdColumn.notnull === 1 ? 'требует NOT NULL, но должно быть необязательным' : 'корректно настроено как необязательное'}`);
    }
    
    // Проверяем внешние ключи для этих полей
    const districtFK = foreignKeys.find(fk => fk.from === 'districtId');
    const buildingFK = foreignKeys.find(fk => fk.from === 'buildingId');
    
    if (!districtFK) {
      console.log('❌ Внешний ключ для districtId отсутствует!');
    } else {
      console.log(`✅ Внешний ключ для districtId настроен: ${districtFK.table}(${districtFK.to})`);
    }
    
    if (!buildingFK) {
      console.log('❌ Внешний ключ для buildingId отсутствует!');
    } else {
      console.log(`✅ Внешний ключ для buildingId настроен: ${buildingFK.table}(${buildingFK.to})`);
    }
    console.log('-----------------------------');
    
    // Проверяем индексы
    db.all(`PRAGMA index_list(properties)`, [], (err, indexes) => {
      if (err) {
        console.error('Ошибка при получении информации об индексах:', err.message);
        db.close();
        return;
      }
      
      console.log('\nИндексы таблицы properties:');
      console.log('-----------------------------');
      indexes.forEach(idx => {
        console.log(`${idx.name} (${idx.unique ? 'UNIQUE' : 'NOT UNIQUE'})`);
        
        // Получаем информацию о столбцах индекса
        db.all(`PRAGMA index_info(${idx.name})`, [], (err, indexColumns) => {
          if (err) {
            console.error(`Ошибка при получении информации о столбцах индекса ${idx.name}:`, err.message);
            return;
          }
          
          indexColumns.forEach(col => {
            console.log(`  - ${col.name}`);
          });
        });
      });
      
      // После всех проверок закрываем соединение
      setTimeout(() => {
        console.log('\nАнализ завершен.');
        db.close();
      }, 1000);
    });
  });
});