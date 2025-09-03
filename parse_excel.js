const XLSX = require('xlsx');
const fs = require('fs');

try {
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile('ГОД ПОСТРОЙКИ.xlsx');
    
    console.log('Sheet names:', workbook.SheetNames);
    
    // Process each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`\nProcessing sheet ${index + 1}: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`Rows in sheet: ${jsonData.length}`);
        
        if (jsonData.length > 0) {
            console.log('Column headers:', Object.keys(jsonData[0]));
            console.log('First few rows:');
            jsonData.slice(0, 3).forEach((row, i) => {
                console.log(`  Row ${i + 1}:`, row);
            });
        }
        
        // Save as CSV
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        fs.writeFileSync(`sheet_${index + 1}_${sheetName}.csv`, csv, 'utf8');
        console.log(`Saved as sheet_${index + 1}_${sheetName}.csv`);
    });
    
} catch (error) {
    console.error('Error:', error.message);
}