const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function importDataFromCSV() {
  try {
    console.log('Начинаю импорт данных из CSV...');

    const districts = new Set();
    const buildings = new Map(); // ключ: район_улица_дом, значение: данные здания
    const csvData = [];

    // Путь к CSV файлу
    const csvPath = path.join(__dirname, '..', 'База недвижимости.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`Файл не найден: ${csvPath}`);
    }

    // Читаем CSV файл
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath, { encoding: 'utf8' })
        .pipe(csv())
        .on('data', (row) => {
          csvData.push(row);
          
          // Собираем районы
          if (row['Район'] && row['Район'].trim()) {
            districts.add(row['Район'].trim());
          }
          
          // Собираем здания
          if (row['Район'] && row['Улица'] && row['Д-кв']) {
            const district = row['Район'].trim();
            const street = row['Улица'].trim();
            const houseNumber = row['Д-кв'].toString().trim();
            const key = `${district}_${street}_${houseNumber}`;
            
            if (!buildings.has(key)) {
              buildings.set(key, {
                district,
                street,
                houseNumber,
                yearBuilt: row['Год'] ? parseInt(row['Год']) : null,
                wallMaterial: row['М'] || null,
                layout: row['План'] || null,
                totalFloors: row['Эть'] ? parseInt(row['Эть']) : null,
                hasElevator: false,
                heatingType: 'центральное'
              });
            }
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Найдено ${districts.size} уникальных районов`);
    console.log(`Найдено ${buildings.size} уникальных зданий`);

    // Импортируем районы
    console.log('Импортирую районы...');
    const districtMap = new Map();
    
    for (const districtName of districts) {
      try {
        // Проверяем, есть ли уже такой район
        let district = await prisma.district.findFirst({
          where: { name: districtName }
        });
        
        if (!district) {
          district = await prisma.district.create({
            data: {
              name: districtName,
              description: `Район ${districtName}`,
              isActive: true
            }
          });
          console.log(`  Создан район: ${districtName}`);
        } else {
          console.log(`  Район уже существует: ${districtName}`);
        }
        
        districtMap.set(districtName, district.id);
      } catch (error) {
        console.error(`Ошибка при создании района ${districtName}:`, error);
      }
    }

    // Импортируем здания
    console.log('Импортирую здания...');
    let buildingsCreated = 0;
    let buildingsSkipped = 0;
    
    for (const [key, buildingData] of buildings) {
      try {
        const districtId = districtMap.get(buildingData.district);
        if (!districtId) {
          console.log(`  Пропущено здание: нет района ${buildingData.district}`);
          buildingsSkipped++;
          continue;
        }
        
        // Проверяем, есть ли уже такое здание
        const existingBuilding = await prisma.building.findFirst({
          where: {
            districtId,
            street: buildingData.street,
            houseNumber: buildingData.houseNumber
          }
        });
        
        if (!existingBuilding) {
          await prisma.building.create({
            data: {
              districtId,
              street: buildingData.street,
              houseNumber: buildingData.houseNumber,
              yearBuilt: buildingData.yearBuilt,
              wallMaterial: buildingData.wallMaterial,
              layout: buildingData.layout,
              totalFloors: buildingData.totalFloors,
              hasElevator: buildingData.hasElevator,
              hasGarbageChute: false, // добавляем обязательное поле
              heatingType: buildingData.heatingType,
              isActive: true
            }
          });
          
          buildingsCreated++;
          if (buildingsCreated % 50 === 0) {
            console.log(`  Создано зданий: ${buildingsCreated}`);
          }
        } else {
          buildingsSkipped++;
        }
      } catch (error) {
        console.error(`Ошибка при создании здания ${key}:`, error.message);
        buildingsSkipped++;
      }
    }

    console.log('\n=== РЕЗУЛЬТАТЫ ИМПОРТА ===');
    console.log(`Районы: ${districts.size} обработано`);
    console.log(`Здания: ${buildingsCreated} создано, ${buildingsSkipped} пропущено`);
    console.log(`Всего записей в CSV: ${csvData.length}`);
    console.log('Импорт завершён успешно!');

  } catch (error) {
    console.error('Ошибка импорта:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем импорт
importDataFromCSV();