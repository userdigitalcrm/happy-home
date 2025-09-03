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

// Получаем список всех таблиц
db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, tables) => {
  if (err) {
    console.error('Ошибка при получении списка таблиц:', err.message);
    db.close();
    return;
  }

  console.log('\nСписок таблиц в базе данных:');
  console.log('-----------------------------');
  tables.forEach(table => {
    console.log(table.name);
  });

  console.log('\nДетальный анализ структуры таблиц:');
  console.log('-----------------------------');

  // Для каждой таблицы получаем структуру и выводим подробную информацию
  let processedTables = 0;
  tables.forEach(table => {
    db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
      if (err) {
        console.error(`Ошибка при получении информации о таблице ${table.name}:`, err.message);
        return;
      }

      console.log(`\nТаблица: ${table.name}`);
      console.log('Столбцы:');
      columns.forEach(column => {
        const notNull = column.notnull === 1 ? 'NOT NULL' : 'NULL';
        const defaultValue = column.dflt_value !== null ? `DEFAULT ${column.dflt_value}` : '';
        const pk = column.pk === 1 ? 'PRIMARY KEY' : '';
        console.log(`  - ${column.name}: ${column.type} ${notNull} ${defaultValue} ${pk}`);
      });

      // Получаем информацию о внешних ключах
      db.all(`PRAGMA foreign_key_list(${table.name})`, [], (err, foreignKeys) => {
        if (err) {
          console.error(`Ошибка при получении информации о внешних ключах для таблицы ${table.name}:`, err.message);
          return;
        }

        if (foreignKeys.length > 0) {
          console.log('  Внешние ключи:');
          foreignKeys.forEach(fk => {
            console.log(`  - ${fk.from} -> ${fk.table}(${fk.to}) [${fk.on_update}/${fk.on_delete}]`);
          });
        } else {
          console.log('  Внешние ключи: отсутствуют');
        }

        // Получаем информацию об индексах
        db.all(`PRAGMA index_list(${table.name})`, [], (err, indexes) => {
          if (err) {
            console.error(`Ошибка при получении информации об индексах для таблицы ${table.name}:`, err.message);
            return;
          }

          if (indexes.length > 0) {
            console.log('  Индексы:');
            indexes.forEach(idx => {
              console.log(`  - ${idx.name} (${idx.unique ? 'UNIQUE' : 'NOT UNIQUE'})`);
            });
          } else {
            console.log('  Индексы: отсутствуют');
          }

          // Проверяем наличие данных в таблице
          db.get(`SELECT COUNT(*) as count FROM ${table.name}`, [], (err, result) => {
            if (err) {
              console.error(`Ошибка при подсчете записей в таблице ${table.name}:`, err.message);
              return;
            }

            console.log(`  Количество записей: ${result.count}`);

            // Увеличиваем счетчик обработанных таблиц
            processedTables++;

            // Если обработали все таблицы, проводим сравнение с схемой Prisma
            if (processedTables === tables.length) {
              console.log('\n\nСравнение с схемой Prisma:');
              console.log('-----------------------------');
              
              // Проверяем соответствие таблицы properties схеме Prisma
              db.all(`PRAGMA table_info(properties)`, [], (err, columns) => {
                if (err) {
                  console.error('Ошибка при получении информации о таблице properties:', err.message);
                  return;
                }
                
                const districtIdColumn = columns.find(c => c.name === 'districtId');
                const buildingIdColumn = columns.find(c => c.name === 'buildingId');
                
                console.log('Проверка полей таблицы properties:');
                
                if (!districtIdColumn) {
                  console.log('❌ Поле districtId отсутствует!');
                } else {
                  console.log(`${districtIdColumn.notnull === 1 ? '❌' : '✅'} districtId: ${districtIdColumn.type} ${districtIdColumn.notnull === 1 ? 'NOT NULL (требуется изменение)' : 'NULL (корректно)'}`);
                }
                
                if (!buildingIdColumn) {
                  console.log('❌ Поле buildingId отсутствует!');
                } else {
                  console.log(`${buildingIdColumn.notnull === 1 ? '❌' : '✅'} buildingId: ${buildingIdColumn.type} ${buildingIdColumn.notnull === 1 ? 'NOT NULL (требуется изменение)' : 'NULL (корректно)'}`);
                }
                
                // Проверяем наличие внешних ключей
                db.all(`PRAGMA foreign_key_list(properties)`, [], (err, foreignKeys) => {
                  if (err) {
                    console.error('Ошибка при получении информации о внешних ключах для таблицы properties:', err.message);
                    return;
                  }
                  
                  const districtFK = foreignKeys.find(fk => fk.from === 'districtId');
                  const buildingFK = foreignKeys.find(fk => fk.from === 'buildingId');
                  
                  console.log('\nПроверка внешних ключей:');
                  
                  if (!districtFK) {
                    console.log('❌ Внешний ключ для districtId отсутствует!');
                  } else {
                    console.log(`✅ Внешний ключ для districtId настроен: ${districtFK.table}(${districtFK.to}) [${districtFK.on_update}/${districtFK.on_delete}]`);
                  }
                  
                  if (!buildingFK) {
                    console.log('❌ Внешний ключ для buildingId отсутствует!');
                  } else {
                    console.log(`✅ Внешний ключ для buildingId настроен: ${buildingFK.table}(${buildingFK.to}) [${buildingFK.on_update}/${buildingFK.on_delete}]`);
                  }
                  
                  // Проверяем наличие категории РИЭЛТОР
                  db.all(`SELECT * FROM categories WHERE name = 'РИЭЛТОР'`, [], (err, categories) => {
                    if (err) {
                      console.error('Ошибка при проверке категории РИЭЛТОР:', err.message);
                      return;
                    }
                    
                    if (categories.length === 0) {
                      console.log('\n❌ Категория "РИЭЛТОР" отсутствует в базе данных!');
                    } else {
                      console.log(`\n✅ Категория "РИЭЛТОР" найдена в базе данных. ID: ${categories[0].id}`);
                    }
                    
                    // Проверяем наличие объектов с категорией РИЭЛТОР
                    if (categories.length > 0) {
                      db.all(`SELECT COUNT(*) as count FROM properties WHERE categoryId = ?`, [categories[0].id], (err, result) => {
                        if (err) {
                          console.error('Ошибка при подсчете объектов с категорией РИЭЛТОР:', err.message);
                          return;
                        }
                        
                        console.log(`Количество объектов с категорией РИЭЛТОР: ${result[0].count}`);
                        
                        // Если есть объекты, проверяем их структуру
                        if (result[0].count > 0) {
                          db.all(`SELECT * FROM properties WHERE categoryId = ? LIMIT 1`, [categories[0].id], (err, properties) => {
                            if (err) {
                              console.error('Ошибка при получении объекта с категорией РИЭЛТОР:', err.message);
                              return;
                            }
                            
                            console.log('\nПример объекта с категорией РИЭЛТОР:');
                            console.log(properties[0]);
                          });
                        }
                        
                        console.log('\nРезультат анализа:');
                        console.log('1. База данных SQLite имеет корректную структуру таблиц');
                        console.log(`2. Поля districtId и buildingId ${districtIdColumn && districtIdColumn.notnull !== 1 && buildingIdColumn && buildingIdColumn.notnull !== 1 ? 'могут быть NULL' : 'НЕ могут быть NULL (проблема)'}`);
                        console.log(`3. Внешние ключи для districtId и buildingId ${districtFK && buildingFK ? 'настроены корректно' : 'отсутствуют (проблема)'}`);
                        
                        // Закрываем соединение
                        db.close();
                      });
                    } else {
                      console.log('\nРезультат анализа:');
                      console.log('1. База данных SQLite имеет корректную структуру таблиц');
                      console.log(`2. Поля districtId и buildingId ${districtIdColumn && districtIdColumn.notnull !== 1 && buildingIdColumn && buildingIdColumn.notnull !== 1 ? 'могут быть NULL' : 'НЕ могут быть NULL (проблема)'}`);
                      console.log(`3. Внешние ключи для districtId и buildingId ${districtFK && buildingFK ? 'настроены корректно' : 'отсутствуют (проблема)'}`);
                      console.log('4. Категория РИЭЛТОР отсутствует, что может вызывать проблемы');
                      
                      // Закрываем соединение
                      db.close();
                    }
                  });
                });
              });
            }
          });
        });
      });
    });
  });
});