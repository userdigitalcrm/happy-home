const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDistricts() {
  try {
    const districts = await prisma.district.findMany({
      take: 5,
    });
    
    console.log('Districts:');
    districts.forEach((district, index) => {
      console.log(`${index + 1}. ID: ${district.id}, Name: ${district.name}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

getDistricts();