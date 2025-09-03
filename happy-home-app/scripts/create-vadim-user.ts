import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createVadimUser() {
  try {
    const email = 'vadimexpert95@gmail.com'
    const name = 'Вадим'
    const password = 'Vadim.2015'
    const role = 'ADMIN' // Using string directly since UserRole enum might not be available

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create the user with the hashed password
    // @ts-ignore: Password field might not be in the Prisma types yet
    const user = await prisma.user.create({
      data: {
        email: email,
        name: name,
        password: hashedPassword,
        role: role,
        isActive: true
      }
    })
    
    console.log(`User created successfully!`)
    console.log(`ID: ${user.id}`)
    console.log(`Email: ${user.email}`)
    console.log(`Name: ${user.name}`)
    console.log(`Role: ${user.role}`)
    console.log(`Active: ${user.isActive}`)
  } catch (error) {
    console.error('Error creating user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createVadimUser()