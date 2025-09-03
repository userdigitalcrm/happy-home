const { PrismaClient } = require('@prisma/client');

async function checkCategories() {
  const prisma = new PrismaClient();
  
  try {
    const categories = await prisma.category.findMany();
    console.log('Categories in DB:', categories.length);
    console.log('Category names:', categories.map(c => c.name));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();