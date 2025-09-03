const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Testing database seeding...');
    
    // Test categories
    const categories = await prisma.category.count();
    console.log(`✅ Categories: ${categories}`);
    
    // Test districts
    const districts = await prisma.district.count();
    console.log(`✅ Districts: ${districts}`);
    
    // Test buildings
    const buildings = await prisma.building.count();
    console.log(`✅ Buildings: ${buildings}`);
    
    // Test users
    const users = await prisma.user.count();
    console.log(`✅ Users: ${users}`);
    
    // Test sample property
    const properties = await prisma.property.count();
    console.log(`✅ Properties: ${properties}`);
    
    console.log('🎉 Database seeding verification completed successfully!');
    
    if (categories > 0 && districts > 0 && buildings > 0 && users > 0) {
      console.log('✅ All required data has been seeded successfully');
    } else {
      console.log('⚠️  Some data may be missing');
    }
    
  } catch (error) {
    console.error('❌ Error testing database seeding:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();