const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const csv = require('csv-parser');

async function seedBuildings() {
  try {
    console.log('🌱 Seeding buildings with "Без района" district assignment...');
    
    // First, ensure we have a "Без района" district
    let noDistrict = await prisma.district.findFirst({
      where: { name: 'Без района' }
    });
    
    if (!noDistrict) {
      noDistrict = await prisma.district.create({
        data: {
          name: 'Без района',
          description: 'Здания, не привязанные к конкретному району',
          isActive: true
        }
      });
      console.log('✅ Created "Без района" district');
    } else {
      console.log('✅ Using existing "Без района" district');
    }
    
    // Use the "Без района" district ID for all buildings
    const districtId = noDistrict.id;
    
    // Read and process CSV file
    const results = [];
    
    // Create a read stream
    fs.createReadStream('c:/Users/donpa/Desktop/happy-home/ГОД_ПОСТРОЙКИ_UTF8_BOM.csv')
      .pipe(csv({
        separator: ';',
        // Define headers manually
        headers: ['полный_адрес', 'улица', 'номер_дома', 'год_постройки', 'этажность', 'материал_стен', 'планировка'],
        skipLines: 1 // Skip header line
      }))
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        console.log(`Read ${results.length} rows from CSV`);
        
        let created = 0;
        let updated = 0;
        let errors = 0;
        
        // Process each row
        for (const row of results) {
          try {
            // Clean and extract data from row
            const street = row['улица'] ? row['улица'].trim() : '';
            const houseNumber = row['номер_дома'] ? row['номер_дома'].trim() : '';
            const yearBuilt = row['год_постройки'] && row['год_постройки'].trim() ? parseInt(row['год_постройки']) : null;
            const totalFloors = row['этажность'] && row['этажность'].trim() ? parseInt(row['этажность']) : null;
            
            // Map wall material to abbreviations
            let wallMaterial = '';
            if (row['материал_стен']) {
              const material = row['материал_стен'].trim().toLowerCase();
              if (material === 'к') wallMaterial = 'к';
              else if (material === 'п') wallMaterial = 'п';
              else if (material === 'б') wallMaterial = 'б';
              else if (material === 'д') wallMaterial = 'д';
              else if (material.includes('монолит')) wallMaterial = 'монолит';
              else wallMaterial = material;
            }
            
            // Map layout to the standardized abbreviations
            let layout = '';
            if (row['планировка']) {
              const planType = row['планировка'].trim().toLowerCase();
              if (planType.includes('нов')) layout = 'нов';
              else if (planType.includes('нвстр')) layout = 'нвстр';
              else if (planType.includes('ст')) layout = 'ст';
              else if (planType.includes('ул')) layout = 'ул';
              else if (planType.includes('лен')) layout = 'лен';
              else if (planType.includes('омс')) layout = 'омс';
              else if (planType.includes('гост')) layout = 'гост';
              else if (planType.includes('общ')) layout = 'общ';
              else layout = planType;
            }
            
            // Skip empty entries
            if (!street || !houseNumber) {
              console.log('Skipping row with empty street or house number');
              continue;
            }
            
            // Generate full address
            const fullAddress = `${street}, ${houseNumber}`;
            
            // Check if building already exists
            const existingBuilding = await prisma.building.findFirst({
              where: {
                street,
                houseNumber
              }
            });
            
            if (existingBuilding) {
              // Update existing building with "Без района" district
              await prisma.building.update({
                where: { id: existingBuilding.id },
                data: {
                  districtId, // Assign to "Без района" district
                  yearBuilt,
                  totalFloors,
                  wallMaterial,
                  layout,
                  confidenceLevel: 'HIGH',
                  dataSource: 'csv_import'
                }
              });
              updated++;
              if (updated % 50 === 0) {
                console.log(`Updated ${updated} buildings so far`);
              }
            } else {
              // Create new building with "Без района" district
              await prisma.building.create({
                data: {
                  districtId, // Assign to "Без района" district
                  street,
                  houseNumber,
                  fullAddress,
                  yearBuilt,
                  totalFloors,
                  wallMaterial,
                  layout,
                  hasElevator: totalFloors > 5,
                  hasGarbageChute: false,
                  isVerified: true,
                  isActive: true,
                  confidenceLevel: 'HIGH',
                  dataSource: 'csv_import'
                }
              });
              created++;
              if (created % 50 === 0) {
                console.log(`Created ${created} buildings so far`);
              }
            }
          } catch (error) {
            console.error(`Error processing row:`, error);
            errors++;
          }
        }
        
        console.log(`✅ Buildings seeding completed! Created: ${created}, Updated: ${updated}, Errors: ${errors}`);
        console.log('💡 All buildings have been assigned to the "Без района" district.');
        console.log('💡 You can reassign them to proper districts through the admin panel later.');
      });
  } catch (error) {
    console.error('❌ Buildings seeding failed:', error);
  }
}

// Run the seeding
seedBuildings()
  .then(() => console.log('Process finished'))
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });