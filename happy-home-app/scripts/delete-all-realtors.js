const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllRealtors() {
  console.log('🗑️ Удаление всех объектов категории "РИЭЛТОР"...');
  
  try {
    // Находим категорию РИЭЛТОР
    const realtorCategory = await prisma.category.findUnique({
      where: { name: 'РИЭЛТОР' }
    });
    
    if (!realtorCategory) {
      console.error('❌ Категория "РИЭЛТОР" не найдена!');
      return;
    }
    
    console.log(`✅ Категория "РИЭЛТОР" найдена с ID: ${realtorCategory.id}`);
    
    // Удаляем все объекты этой категории
    const deleteResult = await prisma.property.deleteMany({
      where: {
        categoryId: realtorCategory.id
      }
    });
    
    console.log(`✅ Удалено ${deleteResult.count} объектов категории "РИЭЛТОР"`);
    
  } catch (error) {
    console.error('❌ Ошибка при удалении объектов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем удаление
deleteAllRealtors();