import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - получение списка зданий с фильтрацией и пагинацией
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка прав доступа - только администраторы и менеджеры
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Log parameters for debugging
    console.log('API called with searchParams:', Object.fromEntries(searchParams.entries()));
    
    // Параметры пагинации
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Параметры фильтрации
    const districtId = searchParams.get('districtId');
    const yearBuilt = searchParams.get('yearBuilt');
    const wallMaterial = searchParams.get('wallMaterial');
    const totalFloors = searchParams.get('totalFloors');
    const layout = searchParams.get('layout');
    const search = searchParams.get('search'); // Поиск по адресу
    
    // Формирование условий поиска
    const where: any = {
      isActive: true
    };
    
    if (districtId) {
      where.districtId = districtId;
    }
    
    if (yearBuilt) {
      where.yearBuilt = parseInt(yearBuilt);
    }
    
    if (wallMaterial) {
      where.wallMaterial = wallMaterial;
    }
    
    if (totalFloors) {
      where.totalFloors = parseInt(totalFloors);
    }
    
    if (layout) {
      where.layout = layout;
    }
    
    if (search) {
      where.OR = [
        { fullAddress: { contains: search } },
        { street: { contains: search } },
        { houseNumber: { contains: search } }
      ];
    }
    
    // Получение зданий с учетом фильтров и пагинации
    const [buildings, total] = await Promise.all([
      prisma.building.findMany({
        where,
        include: {
          district: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.building.count({ where })
    ]);
    
    return NextResponse.json({
      buildings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Buildings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buildings' },
      { status: 500 }
    );
  }
}

// PUT - обновление данных здания
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка прав доступа - только администраторы и менеджеры
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, districtId, street, houseNumber, yearBuilt, wallMaterial, totalFloors, layout, hasElevator } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Building ID is required' },
        { status: 400 }
      );
    }

    // Проверка существования района
    if (districtId) {
      const district = await prisma.district.findUnique({
        where: { id: districtId }
      });
      
      if (!district) {
        return NextResponse.json(
          { error: 'District not found' },
          { status: 404 }
        );
      }
    }

    // Обновление данных здания
    const updatedBuilding = await prisma.building.update({
      where: { id },
      data: {
        ...(districtId && { districtId }),
        ...(street && { street: street.trim() }),
        ...(houseNumber && { houseNumber: houseNumber.trim() }),
        ...(yearBuilt && { yearBuilt: parseInt(yearBuilt) }),
        ...(wallMaterial && { wallMaterial }),
        ...(totalFloors && { totalFloors: parseInt(totalFloors) }),
        ...(layout && { layout }),
        ...(typeof hasElevator === 'boolean' && { hasElevator }),
        // Обновляем полный адрес при изменении улицы или номера дома
        ...( (street || houseNumber) && {
          fullAddress: `${street?.trim() || (await prisma.building.findUnique({ where: { id } }))?.street}, ${houseNumber?.trim() || (await prisma.building.findUnique({ where: { id } }))?.houseNumber}`
        })
      },
      include: {
        district: true
      }
    });

    return NextResponse.json(updatedBuilding);
    
  } catch (error) {
    console.error('Building update error:', error);
    return NextResponse.json(
      { error: 'Failed to update building' },
      { status: 500 }
    );
  }
}

// POST - создание нового здания
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка прав доступа - только администраторы и менеджеры
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { districtId, street, houseNumber, yearBuilt, wallMaterial, totalFloors, layout, hasElevator } = body;

    // Валидация обязательных полей
    if (!districtId || !street || !houseNumber) {
      return NextResponse.json(
        { error: 'District, street, and house number are required' },
        { status: 400 }
      );
    }

    // Проверка существования района
    const district = await prisma.district.findUnique({
      where: { id: districtId }
    });
    
    if (!district) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      );
    }

    // Проверка, существует ли уже такое здание
    const existingBuilding = await prisma.building.findFirst({
      where: {
        districtId,
        street: street.trim(),
        houseNumber: houseNumber.trim()
      }
    });
    
    if (existingBuilding) {
      return NextResponse.json(
        { error: 'Building with this address already exists' },
        { status: 409 }
      );
    }

    // Создание нового здания
    const newBuilding = await prisma.building.create({
      data: {
        districtId,
        street: street.trim(),
        houseNumber: houseNumber.trim(),
        fullAddress: `${street.trim()}, ${houseNumber.trim()}`,
        ...(yearBuilt && { yearBuilt: parseInt(yearBuilt) }),
        ...(wallMaterial && { wallMaterial }),
        ...(totalFloors && { totalFloors: parseInt(totalFloors) }),
        ...(layout && { layout }),
        ...(typeof hasElevator === 'boolean' && { hasElevator }),
        hasGarbageChute: false,
        isVerified: false,
        isActive: true,
        confidenceLevel: 'MEDIUM',
        dataSource: 'manual'
      },
      include: {
        district: true
      }
    });

    return NextResponse.json(newBuilding, { status: 201 });
    
  } catch (error) {
    console.error('Building creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create building' },
      { status: 500 }
    );
  }
}

// DELETE - деактивация здания (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка прав доступа - только администраторы и менеджеры
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Building ID is required' },
        { status: 400 }
      );
    }

    // Деактивация здания (soft delete)
    const deactivatedBuilding = await prisma.building.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Building deactivated successfully' });
    
  } catch (error) {
    console.error('Building deactivation error:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate building' },
      { status: 500 }
    );
  }
}