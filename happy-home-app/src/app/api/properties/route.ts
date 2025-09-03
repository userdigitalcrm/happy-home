import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Archived filter
    const includeArchived = searchParams.get('includeArchived') === 'true'
    
    // Parse filters
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 50
    
    // Additional filters - only process if they exist
    const categoryIds = searchParams.has('category') ? searchParams.get('category')?.split(',').filter(Boolean) || [] : undefined
    const districtIds = searchParams.has('district') ? searchParams.get('district')?.split(',').filter(Boolean) || [] : undefined
    const statuses = searchParams.has('status') ? searchParams.get('status')?.split(',').filter(Boolean) || [] : undefined
    const layouts = searchParams.has('layout') ? searchParams.get('layout')?.split(',').filter(Boolean) || [] : undefined
    const wallMaterials = searchParams.has('wallMaterial') ? searchParams.get('wallMaterial')?.split(',').filter(Boolean) || [] : undefined
    const balconyTypes = searchParams.has('balconyType') ? searchParams.get('balconyType')?.split(',').filter(Boolean) || [] : undefined
    const pFields = searchParams.has('pField') ? searchParams.get('pField')?.split(',').filter(Boolean) || [] : undefined
    const conditions = searchParams.has('condition') ? searchParams.get('condition')?.split(',').filter(Boolean) || [] : undefined
    const phoneSearch = searchParams.has('phone') ? searchParams.get('phone')?.trim() || '' : undefined
    const streetSearch = searchParams.has('street') ? searchParams.get('street')?.trim() || '' : undefined
    const houseNumberSearch = searchParams.has('houseNumber') ? searchParams.get('houseNumber')?.trim() || '' : undefined
    const sourceSearch = searchParams.has('source') ? searchParams.get('source')?.split(',').filter(Boolean) || [] : undefined
    const descriptionSearch = searchParams.has('description') ? searchParams.get('description')?.trim() || '' : undefined
    
    // Range filters - only process if they exist
    const priceParam = searchParams.has('price') ? searchParams.get('price') : undefined
    const priceMin = priceParam ? Number(priceParam.split(',')[0]) : undefined
    const priceMax = priceParam ? Number(priceParam.split(',')[1]) : undefined
    
    const areaParam = searchParams.has('totalArea') ? searchParams.get('totalArea') : undefined
    const areaMin = areaParam ? Number(areaParam.split(',')[0]) : undefined
    const areaMax = areaParam ? Number(areaParam.split(',')[1]) : undefined
    
    const kitchenAreaParam = searchParams.has('kitchenArea') ? searchParams.get('kitchenArea') : undefined
    const kitchenAreaMin = kitchenAreaParam ? Number(kitchenAreaParam.split(',')[0]) : undefined
    const kitchenAreaMax = kitchenAreaParam ? Number(kitchenAreaParam.split(',')[1]) : undefined
    
    const floorParam = searchParams.has('floor') ? searchParams.get('floor') : undefined
    const floorMin = floorParam ? Number(floorParam.split(',')[0]) : undefined
    const floorMax = floorParam ? Number(floorParam.split(',')[1]) : undefined
    
    const yearBuiltParam = searchParams.has('yearBuilt') ? searchParams.get('yearBuilt') : undefined
    const yearBuiltMin = yearBuiltParam ? Number(yearBuiltParam.split(',')[0]) : undefined
    const yearBuiltMax = yearBuiltParam ? Number(yearBuiltParam.split(',')[1]) : undefined

    // Build where clause
    const where = {
      isArchived: includeArchived
    } as import('@prisma/client').Prisma.PropertyWhereInput

    if (categoryIds && categoryIds.length > 0) {
      where.categoryId = { in: categoryIds }
    }

    if (districtIds && districtIds.length > 0) {
      where.districtId = { in: districtIds }
    }

    if (statuses && statuses.length > 0) {
      where.status = { in: statuses as any }
    }

    if (layouts && layouts.length > 0) {
      where.layout = { in: layouts }
    }

    if (wallMaterials && wallMaterials.length > 0) {
      where.building = {
        is: {
          ...(where.building?.is || {}),
          wallMaterial: { in: wallMaterials }
        }
      }
    }

    if (balconyTypes && balconyTypes.length > 0) {
      where.balcony = { in: balconyTypes }
    }

    if (pFields && pFields.length > 0) {
      where.pField = { in: pFields }
    }

    if (conditions && conditions.length > 0) {
      // For conditions, we need to check if any of the selected conditions are in the condition field
      where.condition = { contains: conditions[0] } // Simplified for now
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {}
      if (priceMin !== undefined) where.price.gte = priceMin
      if (priceMax !== undefined) where.price.lte = priceMax
    }

    if (areaMin !== undefined || areaMax !== undefined) {
      where.totalArea = {}
      if (areaMin !== undefined) where.totalArea.gte = areaMin
      if (areaMax !== undefined) where.totalArea.lte = areaMax
    }

    if (kitchenAreaMin !== undefined || kitchenAreaMax !== undefined) {
      where.kitchenArea = {}
      if (kitchenAreaMin !== undefined) where.kitchenArea.gte = kitchenAreaMin
      if (kitchenAreaMax !== undefined) where.kitchenArea.lte = kitchenAreaMax
    }

    if (floorMin !== undefined || floorMax !== undefined) {
      where.floor = {}
      if (floorMin !== undefined) where.floor.gte = floorMin
      if (floorMax !== undefined) where.floor.lte = floorMax
    }

    if (yearBuiltMin !== undefined || yearBuiltMax !== undefined) {
      where.yearBuilt = {}
      if (yearBuiltMin !== undefined) where.yearBuilt.gte = yearBuiltMin
      if (yearBuiltMax !== undefined) where.yearBuilt.lte = yearBuiltMax
    }

    if (phoneSearch) {
      where.phone = { contains: phoneSearch }
    }

    if (streetSearch) {
      where.building = {
        is: {
          ...(where.building?.is || {}),
          street: { contains: streetSearch }
        }
      }
    }

    if (houseNumberSearch) {
      where.building = {
        is: {
          ...(where.building?.is || {}),
          houseNumber: { contains: houseNumberSearch }
        }
      }
    }

    if (sourceSearch && sourceSearch.length > 0) {
      where.source = { contains: sourceSearch[0] }
    }

    if (descriptionSearch) {
      where.description = { contains: descriptionSearch }
    }

    // Role-based filtering
    if (session.user.role === 'AGENT') {
      // For agents, we want to show ALL properties, not just assigned or created ones
      // Remove the previous filtering logic - agents can see all properties
    }

    // Get pinned properties for agents (properties assigned for call but not yet called)
    let pinnedProperties: import('@prisma/client').Property[] = []
    if (session.user.role === 'AGENT') {
      try {
        const pinnedWhere = {
          callAssignments: {
            some: {
              agentId: session.user.id,
              isCalled: false
            }
          },
          isArchived: includeArchived
        }
        
        pinnedProperties = await prisma.property.findMany({
          where: pinnedWhere,
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

        // Add call assignments manually for pinned properties
        const propertyIds = pinnedProperties.map(p => p.id)
        if (propertyIds.length > 0) {
          let callAssignments: any[] = [];
          try {
            // @ts-ignore: callAssignment model may not exist
            callAssignments = await prisma.callAssignment.findMany({
              where: { 
                propertyId: { in: propertyIds },
                agentId: session.user.id 
              },
              select: { id: true, isCalled: true, agentId: true, propertyId: true }
            })
          } catch (error) {
            // If call_assignments table doesn't exist, continue without call assignments
            console.warn('Call assignments table not found, continuing without call assignments')
            callAssignments = []
          }

          // Attach call assignments to properties
          pinnedProperties = pinnedProperties.map(property => ({
            ...property,
            callAssignments: callAssignments.filter(ca => ca.propertyId === property.id)
          }))
        }

        // Exclude pinned IDs from main query to avoid duplicates
        if (pinnedProperties.length > 0) {
          where.id = { 
            notIn: pinnedProperties.map(p => p.id) 
          }
        }
      } catch (error) {
        // If call_assignments table doesn't exist, continue without pinned properties
        console.warn('Call assignments table not found, continuing without pinned properties')
        pinnedProperties = []
      }
    }

    const [properties, total] = await Promise.all([
      (async () => {
        try {
          const properties = await prisma.property.findMany({
            where,
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
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
          })

          // For agents, add call assignments manually
          if (session.user.role === 'AGENT' && properties.length > 0) {
            const propertyIds = properties.map(p => p.id)
            let callAssignments: any[] = [];
            try {
              // @ts-ignore: callAssignment model may not exist
              callAssignments = await prisma.callAssignment.findMany({
                where: { 
                  propertyId: { in: propertyIds },
                  agentId: session.user.id 
                },
                select: { id: true, isCalled: true, agentId: true, propertyId: true }
              })
            } catch (error) {
              // If call_assignments table doesn't exist, continue without call assignments
              console.warn('Call assignments table not found, continuing without call assignments')
              callAssignments = []
            }

            // Attach call assignments to properties
            return properties.map(property => ({
              ...property,
              callAssignments: callAssignments.filter(ca => ca.propertyId === property.id)
            }))
          }

          return properties
        } catch (error) {
          // If call_assignments table doesn't exist, fetch properties without callAssignments
          console.warn('Call assignments table not found, fetching properties without call assignments')
          return await prisma.property.findMany({
            where,
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
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
          })
        }
      })(),
      prisma.property.count({ where })
    ])

    // Merge pinned and regular properties (pinned first)
    const combinedProperties = [...pinnedProperties, ...properties]

    return NextResponse.json({
      properties: combinedProperties,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    })
  } catch (error) {
    console.error('Properties fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Check if this is a "РИЭЛТОР" category property
    const category = await prisma.category.findUnique({
      where: { id: body.categoryId }
    })
    
    const isRealtorCategory = category?.name === 'РИЭЛТОР'
    
    // For "РИЭЛТОР" category, only validate phone and status
    if (isRealtorCategory) {
      if (!body.phone || !body.status) {
        return NextResponse.json(
          { error: 'Для категории "РИЭЛТОР" обязательны только телефон и статус' },
          { status: 400 }
        )
      }
    } else {
      // For other categories, validate required fields
      if (!body.categoryId || !body.districtId || !body.buildingId) {
        return NextResponse.json(
          { error: 'Категория, район и адрес обязательны' },
          { status: 400 }
        )
      }
    }

    // Extract photos and remove unnecessary fields from the request body
    const { photos, street, houseNumber, ...propertyData } = body

    // For Realtor category, set districtId and buildingId to null if they are empty
    if (isRealtorCategory) {
      propertyData.districtId = propertyData.districtId || null
      propertyData.buildingId = propertyData.buildingId || null
      
      // Remove building relation if it exists to prevent conflicts
      if (propertyData.building) {
        delete propertyData.building
      }
      
      // Remove district relation if it exists
      if (propertyData.district) {
        delete propertyData.district
      }
    }

    // Create the property using Prisma.queryRaw to bypass relation checks
    if (isRealtorCategory) {
      try {
        // Validate that the category exists
        const categoryExists = await prisma.category.findUnique({
          where: { id: propertyData.categoryId }
        });
        
        if (!categoryExists) {
          return NextResponse.json(
            { error: 'Указанная категория не существует' },
            { status: 400 }
          );
        }
        
        // Validate that the user exists
        const userExists = await prisma.user.findUnique({
          where: { id: session.user.id }
        });
        
        if (!userExists) {
          return NextResponse.json(
            { error: 'Пользователь не существует' },
            { status: 400 }
          );
        }
        
        // Use Prisma's raw query capabilities for РИЭЛТОР category
        const uniqueId = `cmf${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
        const now = Date.now();
        
        await prisma.$queryRaw`
          INSERT INTO properties (
            id, categoryId, phone, status, 
            description, createdById, assignedToId,
            createdAt, updatedAt
          ) VALUES (
            ${uniqueId}, 
            ${propertyData.categoryId}, 
            ${propertyData.phone || null}, 
            ${propertyData.status || 'ACTIVE'},
            ${propertyData.description || null}, 
            ${session.user.id}, 
            ${session.user.id},
            ${new Date(now)}, 
            ${new Date(now)}
          )
        `;
        
        // Get the created property
        const createdProperty = await prisma.$queryRaw<
          Array<{
            id: string;
            categoryId: string | null;
            phone: string | null;
            status: string | null;
            description: string | null;
            createdById: string | null;
            assignedToId: string | null;
            createdAt: Date;
            updatedAt: Date;
          }>
        >`
          SELECT * FROM properties WHERE id = ${uniqueId}
        `;
        
        const property = createdProperty[0];
        
        // Create history record
        await prisma.propertyHistory.create({
          data: {
            propertyId: property.id,
            userId: session.user.id,
            action: 'CREATED',
            notes: 'Объект недвижимости создан'
          }
        });
        
        // Return the new property with minimal related data
        return NextResponse.json({
          ...property,
          category: property.categoryId ? await prisma.category.findUnique({ where: { id: property.categoryId }}) : null,
          photos: [],
        });
      } catch (error) {
        console.error('Error creating Realtor property:', error);
        // Handle Prisma foreign key constraint error specifically
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
          return NextResponse.json(
            { error: 'Ошибка валидации данных. Проверьте правильность заполнения полей категории.' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to create property' },
          { status: 500 }
        );
      }
    } else {
      // Standard approach for other categories
      const property = await prisma.property.create({
        data: {
          categoryId: propertyData.categoryId,
          districtId: propertyData.districtId,
          buildingId: propertyData.buildingId,
          apartment: propertyData.apartment || null,
          floor: propertyData.floor ? Number(propertyData.floor) : null,
          totalArea: propertyData.totalArea ? Number(propertyData.totalArea) : null,
          livingArea: propertyData.livingArea ? Number(propertyData.livingArea) : null,
          kitchenArea: propertyData.kitchenArea ? Number(propertyData.kitchenArea) : null,
          balcony: propertyData.balcony || null,
          loggia: propertyData.loggia || false,
          layout: propertyData.layout || null,
          condition: propertyData.condition || null,
          yearBuilt: propertyData.yearBuilt ? Number(propertyData.yearBuilt) : null,
          phone: propertyData.phone || null,
          source: propertyData.source || null,
          price: propertyData.price ? Number(propertyData.price) : null,
          pricePerSqm: propertyData.pricePerSqm ? Number(propertyData.pricePerSqm) : null,
          wallMaterial: propertyData.wallMaterial || null,
          status: propertyData.status || 'ACTIVE',
          description: propertyData.description || null,
          pField: propertyData.pField || null,
          createdById: session.user.id,
          assignedToId: session.user.id,
        }
      });
      
      // If photos are provided, create them separately
      if (photos && Array.isArray(photos) && photos.length > 0) {
        await Promise.all(
          photos.map(async (photo, index) => {
            await prisma.propertyPhoto.create({
              data: {
                propertyId: property.id,
                filename: photo.name || `photo_${index + 1}.jpg`,
                url: photo.url,
                caption: photo.caption || "",
                isPrimary: index === 0 // First photo is primary
              }
            })
          })
        )
      }
      
      // Get the property with photos to return in response
      const propertyWithPhotos = await prisma.property.findUnique({
        where: { id: property.id },
        include: {
          photos: true,
          category: true,
          district: true,
          building: true
        }
      });
      
      // Create history record for property creation
      await prisma.propertyHistory.create({
        data: {
          propertyId: property.id,
          userId: session.user.id,
          action: 'CREATED',
          notes: 'Объект недвижимости создан'
        }
      });
      
      return NextResponse.json(propertyWithPhotos);
    }
  } catch (error) {
    console.error('Properties create error:', error);
    // Handle Prisma foreign key constraint error specifically
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Ошибка валидации данных. Проверьте правильность заполнения полей категории, района и здания.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
