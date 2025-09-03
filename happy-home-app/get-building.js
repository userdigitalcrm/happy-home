const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getBuilding() {
  try {
    const buildings = await prisma.building.findMany({
      take: 5,
    });
    
    console.log('Buildings:');
    buildings.forEach((building, index) => {
      console.log(`${index + 1}. ID: ${building.id}, Address: ${building.street} ${building.houseNumber}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

getBuilding();