import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Извлекаем данные из запроса
    const body = await request.json()
    const { email, name, password } = body
    
    // Проверяем, что все необходимые поля предоставлены
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, имя и пароль обязательны' },
        { status: 400 }
      )
    }
    
    // Проверяем, существует ли уже пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      )
    }
    
    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Создаем нового пользователя с ролью ADMIN
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: 'ADMIN',
        isActive: true
      }
    })
    
    // Проверяем, существует ли колонка password
    try {
      // Пытаемся добавить колонку password, если ее нет
      await prisma.$executeRawUnsafe(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;`
      )
      
      // Обновляем пароль для созданного пользователя
      await prisma.$executeRawUnsafe(
        `UPDATE users SET password = $1 WHERE id = $2`,
        hashedPassword,
        user.id
      )
    } catch (sqlError) {
      // Если SQL-запрос не удался, удаляем созданного пользователя
      await prisma.user.delete({
        where: { id: user.id }
      })
      
      console.error('SQL error:', sqlError)
      
      return NextResponse.json(
        { error: 'Не удалось установить пароль. Пользователь не был создан.' },
        { status: 500 }
      )
    }
    
    // Возвращаем данные созданного пользователя (без пароля)
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating admin user:', error)
    
    return NextResponse.json(
      { error: 'Не удалось создать администратора' },
      { status: 500 }
    )
  }
}