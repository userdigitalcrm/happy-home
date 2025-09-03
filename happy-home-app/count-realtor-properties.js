const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countProperties() {
  try {
    const count = await prisma.property.count({ 
      where: { 
        categoryId: 'cmf0mj6o60006eygsiqavpt4n' 
      } 
    });
    console.log(`REALTOR properties count: ${count}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

countProperties();