const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  try {
    // Create categories sequentially to avoid connection pool issues
    const categoryData = [
      { name: '1 Ком', description: '1-комнатная квартира' },
      { name: '2 Ком', description: '2-комнатная квартира' },
      { name: '3 Ком', description: '3-комнатная квартира' },
      { name: '4 Ком', description: '4-комнатная квартира' },
      { name: '5 Ком', description: '5-комнатная квартира' },
      { name: '6 Ком', description: '6-комнатная квартира' },
      { name: 'РИЭЛТОР', description: 'Коммерческая недвижимость' }
    ];
    
    const categories = [];
    
    for (const data of categoryData) {
      try {
        const category = await prisma.category.upsert({
          where: { name: data.name },
          update: {},
          create: { 
            name: data.name, 
            description: data.description 
          }
        });
        
        categories.push(category);
        console.log(`✅ Created/updated category: ${data.name}`);
      } catch (error) {
        console.error(`❌ Error creating category ${data.name}:`, error.message);
      }
    }

    console.log(`✅ Successfully processed ${categories.length} categories`);

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();