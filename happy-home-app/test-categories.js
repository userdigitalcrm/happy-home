const { PrismaClient } = require('@prisma/client');

async function testCategories() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing categories...');
    const categories = await prisma.category.findMany();
    console.log('Categories found:', categories);
    
    console.log('\nTesting districts...');
    const districts = await prisma.district.findMany();
    console.log('Districts found:', districts.length);
    
    console.log('\nTesting buildings...');
    const buildings = await prisma.building.findMany({ take: 5 });
    console.log('Buildings found:', buildings);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategories();