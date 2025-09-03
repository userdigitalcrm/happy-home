import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma';

// GET - получение списка районов
export async function GET(request: NextRequest) {
  try {
    const districts = await prisma.district.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true
      }
    });

    return NextResponse.json(districts);
    
  } catch (error) {
    console.error('Districts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch districts' },
      { status: 500 }
    );
  }
}

// POST - создание нового района
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const district = await prisma.district.create({
      data: {
        name,
        description
      }
    });

    return NextResponse.json(district, { status: 201 });
  } catch (error) {
    console.error('District creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create district' },
      { status: 500 }
    );
  }
}
