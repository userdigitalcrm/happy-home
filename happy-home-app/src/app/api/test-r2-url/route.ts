import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Имитируем параметры из .env файла
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-16cad59449b5449d94c455f9654e7060.r2.dev';
    const s3Key = 'property-photos/test/test-image.jpg';
    
    // Формируем URL для доступа к файлу
    const fileUrl = `${R2_PUBLIC_URL}/${s3Key}`;
    
    return NextResponse.json({
      success: true,
      publicUrl: R2_PUBLIC_URL,
      s3Key,
      constructedUrl: fileUrl,
      expectedPattern: "https://pub-16cad59449b5449d94c455f9654e7060.r2.dev/property-photos/test/test-image.jpg"
    });
  } catch (error) {
    console.error('Error in test-r2-url:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}