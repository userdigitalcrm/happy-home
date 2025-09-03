import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...')
  
  try {
    // Создаем категории недвижимости
    console.log('Создаем категории недвижимости...')
    const categories = [
      { name: '1 Ком', description: '1-комнатная квартира' },
      { name: '2 Ком', description: '2-комнатная квартира' },
      { name: '3 Ком', description: '3-комнатная квартира' },
      { name: '4 Ком', description: '4-комнатная квартира' },
      { name: '5 Ком', description: '5-комнатная квартира' },
      { name: '6 Ком', description: '6-комнатная квартира' },
      { name: 'РИЭЛТОР', description: 'Коммерческая недвижимость' },
    ]

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      })
    }
    console.log(`✅ Создано ${categories.length} категорий`)

    // Создаем районы Петропавловска
    console.log('Создаем районы Петропавловска...')
    const districtNames = [
      'Вокзал', 'Подгора', 'Рахмет', '20 Мкр', 'Колхозный', 'Бензострой',
      '2 Гор Бол', 'Скиф', 'ДБС', 'ВВИ', 'Северный', 'Рабочий',
      '19 Мкр', 'Азия', 'Буратино', 'Горотдел', 'ДСР', 'Уют',
      'Океан', '8 Школа', 'ДОБ', 'Дельфин', '17 Школа', 'Новый ЦОТ',
      'Сокол', 'Атлантида', 'Тайга', 'Берёзка', '3 Гор Бол', 'Черемушки',
      'Казахтелеком', 'Мастер', 'ЦОН', 'Дошкольник', 'Рахат', 'Новая Мечеть',
      'Бэст', '3 Баня', 'СКГУ', 'Ахтамар', 'Динамо', 'Радужный',
      'Мясокомбинат', 'Борки', 'Старт', 'Драм Театр Погодина', 'Достык Молл',
      '7 Школа', 'Гор Парк'
    ]

    for (const name of districtNames) {
      await prisma.district.upsert({
        where: { name },
        update: {},
        create: { 
          name, 
          description: `${name} район`,
          isActive: true
        }
      })
    }
    console.log(`✅ Создано ${districtNames.length} районов`)

    // Получаем все районы для использования в зданиях
    const districts = await prisma.district.findMany()
    
    // Создаем тестовые здания с справочными данными
    console.log('Создаем тестовые здания...')
    const buildings = [
      {
        districtId: districts[0].id,
        street: 'Конституции Казахстана',
        houseNumber: '1',
        fullAddress: 'Конституции Казахстана, 1',
        yearBuilt: 1985,
        wallMaterial: 'Кирпич',
        layout: 'Улучшенная',
        totalFloors: 9,
        hasElevator: true,
        heatingType: 'Центральное',
        confidenceLevel: 'HIGH',
        dataSource: 'base',
        isVerified: true,
        isActive: true
      },
      {
        districtId: districts[1].id,
        street: 'Жамбыла',
        houseNumber: '15',
        fullAddress: 'Жамбыла, 15',
        yearBuilt: 1975,
        wallMaterial: 'Панель',
        layout: 'Хрущёвка',
        totalFloors: 5,
        hasElevator: false,
        heatingType: 'Центральное',
        confidenceLevel: 'MEDIUM',
        dataSource: 'base',
        isVerified: true,
        isActive: true
      }
    ]

    for (const buildingData of buildings) {
      await prisma.building.upsert({
        where: { 
          districtId_street_houseNumber: { 
            districtId: buildingData.districtId, 
            street: buildingData.street, 
            houseNumber: buildingData.houseNumber 
          }
        },
        update: {},
        create: buildingData,
      })
    }
    console.log(`✅ Создано ${buildings.length} зданий`)

    // Создаем администратора
    console.log('Создаем пользователя-администратора...')
    await prisma.user.upsert({
      where: { email: 'admin@happyhome.kz' },
      update: {},
      create: {
        email: 'admin@happyhome.kz',
        name: 'Администратор',
        role: 'ADMIN',
        isActive: true
      }
    })
    console.log('✅ Создан пользователь-администратор')

    console.log('🎉 База данных успешно заполнена!')
    console.log('Для входа используйте:')
    console.log('Email: admin@happyhome.kz')
    console.log('Пароль: установите через интерфейс приложения')

  } catch (error) {
    console.error('❌ Ошибка при заполнении базы данных:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()