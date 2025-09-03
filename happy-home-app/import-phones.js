const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Constants
const CSV_FILE = '../phones_clean_utf8_bom.csv';
const REALTOR_CATEGORY_ID = 'cmf0mj6o60006eygsiqavpt4n';
const DEFAULT_STATUS = 'ACTIVE'; // Properties will be created with 'ACTIVE' status
const BATCH_SIZE = 100; // Process this many phone numbers at once

async function importPhoneNumbers() {
  try {
    console.log('Starting import process...');
    
    // Check if the file exists
    const filePath = path.resolve(__dirname, CSV_FILE);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return;
    }
    
    console.log(`Reading from file: ${filePath}`);
    
    // Read the entire file content at once since it's a list of phone numbers
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Split the content by new line and filter out empty lines
    const phoneNumbers = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Clean up phone number format
        // Remove any non-digit characters
        let phoneNumber = line.replace(/[^\d]/g, '');
        
        // Make sure it's in the 87XXXXXXXXX format
        if (phoneNumber.length === 10 && !phoneNumber.startsWith('87')) {
          phoneNumber = '87' + phoneNumber;
        }
        
        return phoneNumber;
      })
      .filter(phone => phone.length === 11 && phone.startsWith('87'));
    
    console.log(`Found ${phoneNumbers.length} valid phone numbers for import`);
    
    // Get current user ID (for creating the properties)
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });
    
    if (!adminUser) {
      console.error('Admin user not found! Cannot proceed with import.');
      return;
    }
    
    const userId = adminUser.id;
    console.log(`Using admin user ID: ${userId}`);
    
    // Process phones in batches
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
      const batch = phoneNumbers.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(phoneNumbers.length / BATCH_SIZE)}...`);
      
      const createPromises = batch.map(async (phoneNumber) => {
        try {
          await prisma.property.create({
            data: {
              categoryId: REALTOR_CATEGORY_ID,
              phone: phoneNumber,
              status: DEFAULT_STATUS,
              createdById: userId,
              assignedToId: userId,
              currency: 'KZT', // Default currency required by the schema
            },
          });
          successCount++;
          return true;
        } catch (error) {
          console.error(`Error processing phone ${phoneNumber}:`, error.message);
          errorCount++;
          return false;
        }
      });
      
      await Promise.all(createPromises);
      console.log(`Completed batch ${i / BATCH_SIZE + 1}, imported ${successCount} so far...`);
    }
    
    console.log('\nImport completed!');
    console.log(`Successfully imported: ${successCount} phone numbers`);
    console.log(`Failed to import: ${errorCount} phone numbers`);
    
  } catch (err) {
    console.error('Error during import:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importPhoneNumbers();