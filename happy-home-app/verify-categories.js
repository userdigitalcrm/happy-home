const { PrismaClient } = require('@prisma/client');

async function verifyCategories() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking categories in database...');
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true
      }
    });
    
    console.log(`Found ${categories.length} categories:`);
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (${category.id}) - ${category.description || 'No description'} - ${category.isActive ? 'Active' : 'Inactive'}`);
    });
    
    if (categories.length === 0) {
      console.log('No categories found in database!');
    }
  } catch (error) {
    console.error('Error checking categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCategories();