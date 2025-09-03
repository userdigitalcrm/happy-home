import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        category: true,
        district: true,
        building: true,
        createdBy: {
          select: { name: true, email: true }
        },
        assignedTo: {
          select: { name: true, email: true }
        },
        photos: true,
        histories: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Agents can view all properties (no ownership check needed)
    if (session.user.role !== 'AGENT' && session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // For agents, filter call assignments to only their own
    const propertyWithRelations = { ...property };
    if (session.user.role === 'AGENT') {
      // This will be handled on the client side
      (propertyWithRelations as any).callAssignments = [];
    }

    console.log('Found property with photos:', { id: property.id, photos: property.photos.length });

    return NextResponse.json(propertyWithRelations)
  } catch (error) {
    console.error('Property fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // For AGENT role, we don't need to check if they own the property
    // Agents can update all properties but with field restrictions
    if (session.user.role !== 'AGENT' && session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const property = await prisma.property.findUnique({
      where: { id }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const body = await request.json()
    console.log('Received request body:', body);

    // Check if this is a "РИЭЛТОР" category property
    let isRealtorCategory = false;
    if (body.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId }
      });
      isRealtorCategory = category?.name === 'РИЭЛТОР';
    } else {
      // If categoryId is not being updated, check the current property's category
      const currentCategory = await prisma.category.findUnique({
        where: { id: property.categoryId }
      });
      isRealtorCategory = currentCategory?.name === 'РИЭЛТОР';
    }
    
    // For "РИЭЛТОР" category, only validate phone and status
    if (isRealtorCategory) {
      if (body.phone === undefined && !property.phone) {
        // If phone is not being updated and was not previously set, it's an error
        return NextResponse.json(
          { error: 'Для категории "РИЭЛТОР" обязателен телефон' },
          { status: 400 }
        )
      }
      if (body.status === undefined && !property.status) {
        // If status is not being updated and was not previously set, it's an error
        return NextResponse.json(
          { error: 'Для категории "РИЭЛТОР" обязателен статус' },
          { status: 400 }
        )
      }
    } else {
      // For other categories, validate required fields if they are being updated
      if (body.categoryId !== undefined && !body.categoryId) {
        return NextResponse.json(
          { error: 'Категория обязательна' },
          { status: 400 }
        )
      }
      if (body.districtId !== undefined && !body.districtId) {
        return NextResponse.json(
          { error: 'Район обязателен' },
          { status: 400 }
        )
      }
      if (body.buildingId !== undefined && !body.buildingId) {
        return NextResponse.json(
          { error: 'Адрес обязателен' },
          { status: 400 }
        )
      }
    }

    const updates = { ...body }

    // Extract photos from updates
    const photos = updates.photos
    delete updates.photos

    console.log('Photos extracted:', photos);

    // Remove fields that shouldn't be updated by certain roles
    if (session.user.role === 'AGENT') {
      // For agents, prevent changing address-related fields
      delete updates.categoryId;
      delete updates.districtId;
      delete updates.buildingId;
      delete updates.isArchived;
      delete updates.apartment;
      delete updates.yearBuilt;
      delete updates.wallMaterial;
      delete updates.layout;
      delete updates.totalFloors;
      
      // Also remove building relation if present
      delete updates.building;
      
      // Log what we're removing for debugging
      console.log('AGENT: Removing restricted fields from update:', {
        categoryId: updates.categoryId,
        districtId: updates.districtId,
        buildingId: updates.buildingId,
        isArchived: updates.isArchived,
        apartment: updates.apartment,
        yearBuilt: updates.yearBuilt,
        wallMaterial: updates.wallMaterial,
        layout: updates.layout,
        totalFloors: updates.totalFloors,
        building: updates.building
      });
    }

    // Transform relation fields to Prisma format
    if (updates.categoryId !== undefined) {
      updates.category = { connect: { id: updates.categoryId } }
      delete updates.categoryId
    }
    if (updates.districtId !== undefined) {
      // For Realtor category, set districtId to null if it's empty
      if (isRealtorCategory && !updates.districtId) {
        updates.district = { disconnect: true }
        delete updates.districtId
      } else if (updates.districtId) {
        updates.district = { connect: { id: updates.districtId } }
        delete updates.districtId
      } else {
        delete updates.districtId
      }
    }
    if (updates.buildingId !== undefined) {
      // For Realtor category, set buildingId to null if it's empty
      if (isRealtorCategory && !updates.buildingId) {
        updates.building = { disconnect: true }
        delete updates.buildingId
      } else if (updates.buildingId) {
        updates.building = { connect: { id: updates.buildingId } }
        delete updates.buildingId
      } else {
        delete updates.buildingId
      }
    }

    // Remove fields that don't exist in Property model
    delete updates.street
    delete updates.houseNumber
    
    // Remove readonly fields
    delete updates.id
    delete updates.createdById
    delete updates.createdAt

    // Ensure numeric fields are properly converted
    if (updates.floor !== undefined) {
      updates.floor = updates.floor ? Number(updates.floor) : null;
    }
    if (updates.totalFloors !== undefined) {
      updates.totalFloors = updates.totalFloors ? Number(updates.totalFloors) : null;
    }
    if (updates.totalArea !== undefined) {
      updates.totalArea = updates.totalArea ? Number(updates.totalArea) : null;
    }
    if (updates.livingArea !== undefined) {
      updates.livingArea = updates.livingArea ? Number(updates.livingArea) : null;
    }
    if (updates.kitchenArea !== undefined) {
      updates.kitchenArea = updates.kitchenArea ? Number(updates.kitchenArea) : null;
    }
    if (updates.rooms !== undefined) {
      updates.rooms = updates.rooms ? Number(updates.rooms) : null;
    }
    if (updates.ceilingHeight !== undefined) {
      updates.ceilingHeight = updates.ceilingHeight ? Number(updates.ceilingHeight) : null;
    }
    if (updates.yearBuilt !== undefined) {
      updates.yearBuilt = updates.yearBuilt ? Number(updates.yearBuilt) : null;
    }
    if (updates.price !== undefined) {
      updates.price = updates.price ? Number(updates.price) : null;
    }

    // Calculate price per sqm if price or area changed
    if ((updates.price || updates.totalArea) && updates.totalArea) {
      const price = updates.price || property.price || 0;
      const area = updates.totalArea;
      if (price && area) {
        updates.pricePerSqm = Math.round(Number(price) / Number(area));
      }
    }

    // Ensure pricePerSqm is a number or null
    if (updates.pricePerSqm !== undefined) {
      if (updates.pricePerSqm !== null && !isNaN(Number(updates.pricePerSqm))) {
        updates.pricePerSqm = Number(updates.pricePerSqm);
      } else {
        updates.pricePerSqm = null;
      }
    }

    // Update property data
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updates,
      include: {
        category: true,
        district: true,
        building: true,
        createdBy: {
          select: { name: true, email: true }
        },
        assignedTo: {
          select: { name: true, email: true }
        },
        photos: true
      }
    })

    // Handle photos if provided
    if (photos !== undefined) {
      console.log('Updating photos for property:', id, photos);
      
      // First, delete existing photos
      await prisma.propertyPhoto.deleteMany({
        where: { propertyId: id }
      })
      
      console.log('Deleted existing photos');
      
      // Then create new photos if any provided
      if (Array.isArray(photos) && photos.length > 0) {
        await prisma.propertyPhoto.createMany({
          data: photos.map((photo: any) => ({
            propertyId: id,
            url: photo.url,
            filename: photo.name || 'unnamed.jpg'
          }))
        })
        
        console.log('New photos created successfully');
      }
    }

    // Fetch the property with photos to return
    const propertyWithPhotos = await prisma.property.findUnique({
      where: { id },
      include: {
        category: true,
        district: true,
        building: true,
        createdBy: {
          select: { name: true, email: true }
        },
        assignedTo: {
          select: { name: true, email: true }
        },
        photos: true
      }
    })

    if (!propertyWithPhotos) {
      return NextResponse.json(
        { error: 'Property not found after update' },
        { status: 404 }
      )
    }

    console.log('Returning updated property with photos:', { 
      id: propertyWithPhotos.id, 
      photos: propertyWithPhotos.photos.length 
    });

    // Automatically mark call assignments as called when property is updated by an agent
    if (session.user.role === 'AGENT') {
      try {
        // @ts-ignore: callAssignment model may not exist
        await prisma.callAssignment.updateMany({
          where: {
            propertyId: id,
            agentId: session.user.id,
            isCalled: false
          },
          data: {
            isCalled: true
          }
        });
      } catch (error) {
        console.warn('Could not update call assignments:', error);
      }
    }

    // Create history record for significant changes
    const fieldTranslations: Record<string, string> = {
      category: 'Категория',
      district: 'Район',
      building: 'Здание',
      apartment: 'Квартира',
      floor: 'Этаж',
      totalFloors: 'Этажность',
      totalArea: 'Общая площадь',
      livingArea: 'Жилая площадь',
      kitchenArea: 'Площадь кухни',
      rooms: 'Количество комнат',
      ceilingHeight: 'Высота потолков',
      balcony: 'Балкон',
      loggia: 'Лоджия',
      layout: 'Планировка',
      wallMaterial: 'Материал стен',
      condition: 'Состояние',
      yearBuilt: 'Год постройки',
      phone: 'Телефон',
      source: 'Источник',
      renovation: 'Ремонт',
      pField: 'Поле П',
      price: 'Цена',
      pricePerSqm: 'Цена за м²',
      currency: 'Валюта',
      status: 'Статус',
      description: 'Описание',
      notes: 'Примечания',
      isArchived: 'Архивный'
    };

    const changedFields = Object.keys(updates).filter(key => 
      updates[key] !== (property as any)[key]
    );

    if (changedFields.length > 0) {
      const changes = changedFields.map(key => {
        const fieldName = fieldTranslations[key] || key;
        const oldValue = (property as any)[key];
        const newValue = updates[key];
        
        let oldValueStr = oldValue === null || oldValue === undefined ? 'пусто' : String(oldValue);
        let newValueStr = newValue === null || newValue === undefined ? 'пусто' : String(newValue);
        
        // Обработка булевых значений
        if (typeof oldValue === 'boolean') oldValueStr = oldValue ? 'да' : 'нет';
        if (typeof newValue === 'boolean') newValueStr = newValue ? 'да' : 'нет';
        
        return `${fieldName}: ${oldValueStr} → ${newValueStr}`;
      });

      await prisma.propertyHistory.create({
        data: {
          propertyId: property.id,
          userId: session.user.id,
          action: 'UPDATED',
          notes: `Изменения: ${changes.join('; ')}`
        }
      })
    }

    return NextResponse.json(propertyWithPhotos)
  } catch (error) {
    console.error('Property update error:', error)
    // Handle Prisma foreign key constraint error specifically
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Ошибка валидации данных. Проверьте правильность заполнения полей категории, района и здания.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role === 'AGENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    const property = await prisma.property.findUnique({
      where: { id }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Archive instead of delete
    const archivedProperty = await prisma.property.update({
      where: { id },
      data: { isArchived: true },
      include: {
        category: true,
        district: true,
        building: true
      }
    })

    // Create history record
    await prisma.propertyHistory.create({
      data: {
        propertyId: property.id,
        userId: session.user.id,
        action: 'ARCHIVED',
        notes: `Объект перенесен в архив. Статус: ${property.status} → ARCHIVED`
      }
    })

    return NextResponse.json({ message: 'Property archived successfully' })
  } catch (error) {
    console.error('Property archive error:', error)
    return NextResponse.json(
      { error: 'Failed to archive property' },
      { status: 500 }
    )
  }
}