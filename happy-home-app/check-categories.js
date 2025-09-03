const { PrismaClient } = require('@prisma/client');

async function checkCategories() {
  const prisma = new PrismaClient();
  
  try {
    const categories = await prisma.category.findMany();
    console.log('Categories in DB:', categories.length);
    console.log(categories);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();