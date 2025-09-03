const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCategories() {
  try {
    const categories = await prisma.category.findMany();
    console.log('Categories:');
    categories.forEach(cat => {
      console.log(`ID: ${cat.id}, Name: ${cat.name}, Active: ${cat.isActive}`);
    });
    
    // Find the REALTOR category specifically
    const realtorCategory = categories.find(c => c.name === 'РИЭЛТОР');
    if (realtorCategory) {
      console.log('\nREALTOR Category:');
      console.log(`ID: ${realtorCategory.id}, Name: ${realtorCategory.name}, Active: ${realtorCategory.isActive}`);
    } else {
      console.log('\nREALTOR Category not found!');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

getCategories();