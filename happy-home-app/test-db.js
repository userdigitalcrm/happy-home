console.log('Testing database connection...');

const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection successful:', result);
    
    // Check users table
    const users = await prisma.user.findMany({
      take: 5
    });
    console.log('Users in database:', users.length);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();