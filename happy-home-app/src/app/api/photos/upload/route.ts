import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getServerSession } from 'next-auth'
import { v4 as uuidv4 } from 'uuid'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Настройка клиента S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

// Максимальный размер файла - 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Необходимо авторизоваться' },
        { status: 401 }
      )
    }
    
    // Получение formData из запроса
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      )
    }
    
    // Проверка типа файла
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json(
        { error: 'Недопустимый формат файла. Разрешены только JPEG, PNG и WebP' },
        { status: 400 }
      )
    }
    
    // Проверка размера файла
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Размер файла превышает допустимый лимит (5MB)' },
        { status: 400 }
      )
    }
    
    // Получение и конвертация файла
    const fileArrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(fileArrayBuffer)
    
    // Генерация уникального имени файла
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    const folderPath = `property-photos/${session.user.id}/`
    const s3Key = `${folderPath}${uniqueFileName}`
    
    // Загрузка файла в S3/R2
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME || 'keybridge',
      Key: s3Key,
      Body: fileBuffer,
      ContentType: file.type,
      // Добавляем метаданные для Cloudflare R2
      Metadata: {
        'public': 'true'
      }
    }
    
    await s3Client.send(new PutObjectCommand(uploadParams))

    // Формирование URL для доступа к файлу
    // Используем Public Development URL для Cloudflare R2
    const fileUrl = `https://pub-16cad59449b5449d94c455f9654e7060.r2.dev/${s3Key}`;

    console.log('File uploaded successfully:', { 
      url: fileUrl,
      name: file.name,
      size: file.size,
      type: file.type
    });

    return NextResponse.json(
      { 
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке файла' },
      { status: 500 }
    )
  }
}
