const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const csv = require('csv-parser');
const prisma = new PrismaClient();

// Путь к CSV файлу
const CSV_FILE_PATH = 'c:/Users/donpa/Desktop/happy-home/phones_clean_utf8_bom.csv';

// Функция для нормализации номера телефона
function normalizePhone(phone) {
  // Удаляем все нецифровые символы
  let normalized = phone.replace(/\D/g, '');
  
  // Проверяем, что это валидный казахстанский номер
  if (normalized.length >= 10) {
    // Если начинается с 8 или 7, форматируем как 87XXXXXXXXXX
    if (normalized.startsWith('8') || normalized.startsWith('7')) {
      // Убедимся, что номер начинается с 87
      if (normalized.startsWith('8') && normalized.length >= 11) {
        return normalized.substring(0, 11); // 87XXXXXXXXX
      } else if (normalized.startsWith('7') && normalized.length >= 10) {
        return `8${normalized.substring(0, 10)}`; // преобразуем 7XXX в 87XXX
      }
    }
  }
  
  // Возвращаем исходный номер, если он не соответствует формату
  return normalized;
}

// Функция для извлечения имени из строки
function extractNameFromString(str) {
  // Проверяем, содержит ли строка имя после номера телефона
  const parts = str.split(' ');
  
  if (parts.length > 1) {
    // Первая часть - это номер телефона, остальное может быть именем
    return parts.slice(1).join(' ').trim();
  }
  
  return null;
}

// Главная функция импорта
async function importRieltorPhones() {
  console.log('🌱 Начинаем импорт телефонов риэлторов...');
  
  try {
    // Получаем категорию РИЭЛТОР
    const realtorCategory = await prisma.category.findUnique({
      where: { name: 'РИЭЛТОР' }
    });
    
    if (!realtorCategory) {
      console.error('❌ Категория "РИЭЛТОР" не найдена!');
      return;
    }
    
    console.log(`✅ Категория "РИЭЛТОР" найдена с ID: ${realtorCategory.id}`);
    
    // Получаем пользователя админа для создания объектов
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      console.error('❌ Администратор не найден!');
      return;
    }
    
    console.log(`✅ Администратор найден с ID: ${adminUser.id}`);
    
    // Читаем CSV файл
    const phones = [];
    let processedCount = 0;
    let skippedCount = 0;
    let createdCount = 0;
    
    // Создаем потоковый читатель CSV
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv({
        separator: ',',
        headers: ['phone'],
        skipLines: 1
      }))
      .on('data', (data) => {
        phones.push(data.phone);
      })
      .on('end', async () => {
        console.log(`📊 Прочитано ${phones.length} строк из CSV файла`);
        
        for (const phoneData of phones) {
          try {
            processedCount++;
            
            // Проверяем, есть ли в строке номер телефона
            if (!phoneData || phoneData.trim() === '') {
              skippedCount++;
              continue;
            }
            
            // Извлекаем имя, если оно есть в строке
            let name = null;
            let phoneNumber = phoneData;
            
            // Проверяем, содержит ли строка пробелы (возможное имя)
            if (phoneData.includes(' ')) {
              const nameMatch = extractNameFromString(phoneData);
              if (nameMatch) {
                name = nameMatch;
                // Берем только первую часть строки как номер телефона
                phoneNumber = phoneData.split(' ')[0];
              }
            }
            
            // Нормализуем номер телефона
            const normalizedPhone = normalizePhone(phoneNumber);
            
            // Пропускаем, если номер недействителен
            if (!normalizedPhone || normalizedPhone.length < 10) {
              skippedCount++;
              continue;
            }
            
            // Создаем новый объект с минимальным набором полей
            await prisma.property.create({
              data: {
                categoryId: realtorCategory.id,
                phone: normalizedPhone,
                description: name,
                status: 'ACTIVE',
                createdById: adminUser.id
              }
            });
            createdCount++;
            
            // Показываем прогресс каждые 100 записей
            if (processedCount % 100 === 0) {
              console.log(`⏳ Обработано ${processedCount} из ${phones.length} записей`);
            }
          } catch (error) {
            console.error(`❌ Ошибка при обработке строки '${phoneData}':`, error);
            skippedCount++;
          }
        }
        
        console.log('✅ Импорт завершен!');
        console.log(`📊 Статистика импорта:`);
        console.log(`- Всего обработано: ${processedCount}`);
        console.log(`- Создано новых записей: ${createdCount}`);
        console.log(`- Пропущено: ${skippedCount}`);
        
        await prisma.$disconnect();
      });
  } catch (error) {
    console.error('❌ Ошибка при импорте:', error);
    await prisma.$disconnect();
  }
}

// Запускаем импорт
importRieltorPhones();