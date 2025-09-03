const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'vadimexpert95@gmail.com';
    const newPassword = 'vadim123'; // New password
    
    console.log(`Resetting password for user: ${email}`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`New password: ${newPassword}`);
    console.log(`Hashed password: ${hashedPassword}`);
    
    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password successfully reset!');
    console.log(`User ID: ${updatedUser.id}`);
    console.log(`Email: ${updatedUser.email}`);
    
  } catch (error) {
    console.error('Error resetting password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();