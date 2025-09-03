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
});

// Запускаем транзакцию для модификации схемы
db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF;');
  db.run('BEGIN TRANSACTION;');

  try {
    // 1. Сначала удаляем внешние ключи
    console.log('Удаление внешних ключей...');
    
    // Получаем список всех таблиц для поиска внешних ключей
    db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, tables) => {
      if (err) {
        console.error('Ошибка при получении списка таблиц:', err.message);
        db.run('ROLLBACK;');
        db.close();
        return;
      }
      
      // Создаем временную таблицу без внешних ключей
      console.log('Создание временной таблицы...');
      db.run(`
        CREATE TABLE "properties_new" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "categoryId" TEXT NOT NULL,
          "districtId" TEXT,
          "buildingId" TEXT,
          "apartment" TEXT,
          "floor" INTEGER,
          "totalArea" REAL,
          "livingArea" REAL,
          "kitchenArea" REAL,
          "rooms" INTEGER,
          "ceilingHeight" REAL,
          "balcony" TEXT,
          "loggia" BOOLEAN DEFAULT false,
          "layout" TEXT,
          "totalFloors" INTEGER,
          "wallMaterial" TEXT,
          "condition" TEXT,
          "yearBuilt" INTEGER,
          "phone" TEXT,
          "source" TEXT,
          "renovation" TEXT DEFAULT 'NONE',
          "pField" TEXT,
          "price" REAL,
          "pricePerSqm" REAL,
          "currency" TEXT NOT NULL DEFAULT 'KZT',
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "isArchived" BOOLEAN NOT NULL DEFAULT false,
          "description" TEXT,
          "notes" TEXT,
          "createdById" TEXT NOT NULL,
          "assignedToId" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Ошибка при создании временной таблицы:', err.message);
          db.run('ROLLBACK;');
          db.close();
          return;
        }
        
        // Копируем данные в новую таблицу
        console.log('Копирование данных...');
        db.run(`
          INSERT INTO properties_new
          SELECT * FROM properties
        `, (err) => {
          if (err) {
            console.error('Ошибка при копировании данных:', err.message);
            db.run('ROLLBACK;');
            db.close();
            return;
          }
          
          // Удаляем старую таблицу
          console.log('Удаление старой таблицы...');
          db.run(`DROP TABLE properties`, (err) => {
            if (err) {
              console.error('Ошибка при удалении старой таблицы:', err.message);
              db.run('ROLLBACK;');
              db.close();
              return;
            }
            
            // Переименовываем новую таблицу
            console.log('Переименование новой таблицы...');
            db.run(`ALTER TABLE properties_new RENAME TO properties`, (err) => {
              if (err) {
                console.error('Ошибка при переименовании таблицы:', err.message);
                db.run('ROLLBACK;');
                db.close();
                return;
              }
              
              // Создаем индексы и внешние ключи
              console.log('Создание индексов и внешних ключей...');
              db.run(`CREATE INDEX "properties_isArchived_idx" ON "properties"("isArchived")`, (err) => {
                if (err) {
                  console.error('Ошибка при создании индекса:', err.message);
                  db.run('ROLLBACK;');
                  db.close();
                  return;
                }
                
                // Внешний ключ для categoryId
                db.run(`
                  CREATE INDEX "properties_categoryId_idx" ON "properties"("categoryId");
                  CREATE INDEX "properties_districtId_idx" ON "properties"("districtId");
                  CREATE INDEX "properties_buildingId_idx" ON "properties"("buildingId");
                  CREATE INDEX "properties_createdById_idx" ON "properties"("createdById");
                  CREATE INDEX "properties_assignedToId_idx" ON "properties"("assignedToId");
                `, (err) => {
                  if (err) {
                    console.error('Ошибка при создании индексов внешних ключей:', err.message);
                    db.run('ROLLBACK;');
                    db.close();
                    return;
                  }
                  
                  // Завершаем транзакцию
                  console.log('Применение изменений...');
                  db.run('COMMIT;', (err) => {
                    if (err) {
                      console.error('Ошибка при завершении транзакции:', err.message);
                      db.run('ROLLBACK;');
                      db.close();
                      return;
                    }
                    
                    console.log('Изменения успешно применены.');
                    db.run('PRAGMA foreign_keys = ON;');
                    db.close();
                  });
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Произошла ошибка:', error);
    db.run('ROLLBACK;');
    db.close();
  }
});