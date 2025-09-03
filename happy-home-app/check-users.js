const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - Active: ${user.isActive}`);
      console.log(`   Name: ${user.name || 'No name'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLoginAt || 'Never'}`);
      console.log('---');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking users:', error);
    await prisma.$disconnect();
  }
}

checkUsers();