const XLSX = require('xlsx');
const path = require('path');

try {
    // Read the Excel file
    const workbook = XLSX.readFile('ГОД ПОСТРОЙКИ.xlsx');
    
    // Get sheet names
    console.log('Sheet names:', workbook.SheetNames);
    
    // Read the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('\nFirst 10 rows:');
    data.slice(0, 10).forEach((row, index) => {
        console.log(`Row ${index}:`, row);
    });
    
    console.log('\nTotal rows:', data.length);
    
} catch (error) {
    console.error('Error reading Excel file:', error.message);
}