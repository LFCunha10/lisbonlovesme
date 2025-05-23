import fs from 'fs';
import path from 'path';
import { db, pool } from '../db';
import * as schema from '@shared/schema';

/**
 * Exports all database tables to a SQL file that can be imported elsewhere
 */
async function exportDatabase() {
  try {
    console.log('Starting database export...');
    
    // Create export directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(exportDir, `lisbonlovesme_db_export_${timestamp}.sql`);
    
    // Open file for writing
    const outputStream = fs.createWriteStream(exportPath);
    
    // Write SQL header and transaction start
    outputStream.write(`-- Lisbonlovesme Database Export\n`);
    outputStream.write(`-- Date: ${new Date().toISOString()}\n`);
    outputStream.write(`\n`);
    outputStream.write(`BEGIN;\n\n`);
    
    // Get all data from each table
    const tables = [
      { name: 'tours', schema: schema.tours },
      { name: 'availabilities', schema: schema.availabilities },
      { name: 'bookings', schema: schema.bookings },
      { name: 'testimonials', schema: schema.testimonials },
      { name: 'closed_days', schema: schema.closedDays },
      { name: 'admin_settings', schema: schema.adminSettings },
      { name: 'users', schema: schema.users }
    ];
    
    // Process each table
    for (const table of tables) {
      console.log(`Exporting table: ${table.name}...`);
      
      try {
        // Get all records from table
        const records = await db.select().from(table.schema);
        
        if (records.length > 0) {
          // Write table header
          outputStream.write(`-- Table: ${table.name}\n`);
          
          // Generate INSERT statements for each record
          for (const record of records) {
            const columns = Object.keys(record).filter(key => record[key] !== null);
            const values = columns.map(col => {
              const value = record[col];
              
              // Format values based on their type
              if (value === null) {
                return 'NULL';
              } else if (typeof value === 'string') {
                // Escape quotes in strings
                return `'${value.replace(/'/g, "''")}'`;
              } else if (value instanceof Date) {
                return `'${value.toISOString()}'`;
              } else if (typeof value === 'boolean') {
                return value ? 'TRUE' : 'FALSE';
              } else {
                return value;
              }
            });
            
            // Write INSERT statement
            outputStream.write(`INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`);
          }
          
          outputStream.write(`\n`);
        } else {
          outputStream.write(`-- No data in table: ${table.name}\n\n`);
        }
      } catch (error) {
        console.error(`Error exporting table ${table.name}:`, error);
        outputStream.write(`-- Error exporting table: ${table.name}\n\n`);
      }
    }
    
    // Write transaction commit
    outputStream.write(`COMMIT;\n`);
    
    // Close the file
    outputStream.end();
    
    console.log(`Database export completed successfully!`);
    console.log(`Export file saved to: ${exportPath}`);
    
    return exportPath;
  } catch (error) {
    console.error('Database export failed:', error);
    throw error;
  }
}

// Run the export if this file is executed directly
if (require.main === module) {
  exportDatabase()
    .then(() => {
      console.log('Export process completed.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Export process failed:', error);
      process.exit(1);
    });
}

export { exportDatabase };