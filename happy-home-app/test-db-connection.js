const dotenv = require('dotenv');
dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Test database connection
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    // Test a simple query
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Database query successful, found', users.length, 'users');
  } catch (error) {
    console.error('Database connection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();