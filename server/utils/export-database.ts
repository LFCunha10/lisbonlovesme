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
    
    // Add schema creation statements
    outputStream.write(`-- Schema creation statements\n\n`);
    
    outputStream.write(`-- Users table schema\n`);
    outputStream.write(`DROP TABLE IF EXISTS users CASCADE;\n`);
    outputStream.write(`CREATE TABLE users (\n`);
    outputStream.write(`  id SERIAL PRIMARY KEY,\n`);
    outputStream.write(`  username TEXT NOT NULL UNIQUE,\n`);
    outputStream.write(`  password TEXT NOT NULL,\n`);
    outputStream.write(`  is_admin BOOLEAN DEFAULT FALSE\n`);
    outputStream.write(`);\n\n`);
    
    outputStream.write(`-- Tours table schema\n`);
    outputStream.write(`DROP TABLE IF EXISTS tours CASCADE;\n`);
    outputStream.write(`CREATE TABLE tours (\n`);
    outputStream.write(`  id SERIAL PRIMARY KEY,\n`);
    outputStream.write(`  name TEXT NOT NULL,\n`);
    outputStream.write(`  short_description TEXT DEFAULT '',\n`);
    outputStream.write(`  description TEXT NOT NULL,\n`);
    outputStream.write(`  image_url TEXT NOT NULL,\n`);
    outputStream.write(`  duration TEXT NOT NULL,\n`);
    outputStream.write(`  max_group_size INTEGER NOT NULL,\n`);
    outputStream.write(`  difficulty TEXT NOT NULL,\n`);
    outputStream.write(`  price INTEGER NOT NULL,\n`);
    outputStream.write(`  badge TEXT,\n`);
    outputStream.write(`  badge_color TEXT,\n`);
    outputStream.write(`  is_active BOOLEAN DEFAULT TRUE\n`);
    outputStream.write(`);\n\n`);
    
    outputStream.write(`-- Availabilities table schema\n`);
    outputStream.write(`DROP TABLE IF EXISTS availabilities CASCADE;\n`);
    outputStream.write(`CREATE TABLE availabilities (\n`);
    outputStream.write(`  id SERIAL PRIMARY KEY,\n`);
    outputStream.write(`  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,\n`);
    outputStream.write(`  date TEXT NOT NULL,\n`);
    outputStream.write(`  time TEXT NOT NULL,\n`);
    outputStream.write(`  max_spots INTEGER NOT NULL,\n`);
    outputStream.write(`  spots_left INTEGER NOT NULL\n`);
    outputStream.write(`);\n\n`);
    
    outputStream.write(`-- Bookings table schema\n`);
    outputStream.write(`DROP TABLE IF EXISTS bookings CASCADE;\n`);
    outputStream.write(`CREATE TABLE bookings (\n`);
    outputStream.write(`  id SERIAL PRIMARY KEY,\n`);
    outputStream.write(`  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,\n`);
    outputStream.write(`  availability_id INTEGER NOT NULL REFERENCES availabilities(id) ON DELETE CASCADE,\n`);
    outputStream.write(`  customer_first_name TEXT NOT NULL,\n`);
    outputStream.write(`  customer_last_name TEXT NOT NULL,\n`);
    outputStream.write(`  customer_email TEXT NOT NULL,\n`);
    outputStream.write(`  customer_phone TEXT NOT NULL,\n`);
    outputStream.write(`  number_of_participants INTEGER NOT NULL,\n`);
    outputStream.write(`  special_requests TEXT,\n`);
    outputStream.write(`  booking_reference TEXT NOT NULL UNIQUE,\n`);
    outputStream.write(`  total_amount INTEGER NOT NULL,\n`);
    outputStream.write(`  payment_status TEXT DEFAULT 'pending',\n`);
    outputStream.write(`  stripe_payment_intent_id TEXT,\n`);
    outputStream.write(`  created_at TIMESTAMP DEFAULT NOW(),\n`);
    outputStream.write(`  additional_info JSONB,\n`);
    outputStream.write(`  meeting_point TEXT,\n`);
    outputStream.write(`  reminders_sent BOOLEAN DEFAULT FALSE\n`);
    outputStream.write(`);\n\n`);
    
    outputStream.write(`-- Testimonials table schema\n`);
    outputStream.write(`DROP TABLE IF EXISTS testimonials CASCADE;\n`);
    outputStream.write(`CREATE TABLE testimonials (\n`);
    outputStream.write(`  id SERIAL PRIMARY KEY,\n`);
    outputStream.write(`  customer_name TEXT NOT NULL,\n`);
    outputStream.write(`  customer_country TEXT NOT NULL,\n`);
    outputStream.write(`  rating INTEGER NOT NULL,\n`);
    outputStream.write(`  text TEXT NOT NULL,\n`);
    outputStream.write(`  is_approved BOOLEAN DEFAULT FALSE,\n`);
    outputStream.write(`  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE\n`);
    outputStream.write(`);\n\n`);
    
    outputStream.write(`-- Closed Days table schema\n`);
    outputStream.write(`DROP TABLE IF EXISTS closed_days CASCADE;\n`);
    outputStream.write(`CREATE TABLE closed_days (\n`);
    outputStream.write(`  id SERIAL PRIMARY KEY,\n`);
    outputStream.write(`  date TEXT NOT NULL UNIQUE,\n`);
    outputStream.write(`  reason TEXT,\n`);
    outputStream.write(`  created_at TIMESTAMP DEFAULT NOW()\n`);
    outputStream.write(`);\n\n`);
    
    outputStream.write(`-- Admin Settings table schema\n`);
    outputStream.write(`DROP TABLE IF EXISTS admin_settings CASCADE;\n`);
    outputStream.write(`CREATE TABLE admin_settings (\n`);
    outputStream.write(`  id SERIAL PRIMARY KEY,\n`);
    outputStream.write(`  auto_close_day BOOLEAN DEFAULT FALSE,\n`);
    outputStream.write(`  last_updated TIMESTAMP DEFAULT NOW()\n`);
    outputStream.write(`);\n\n`);
    
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
    

    
    // Process each table for data export
    outputStream.write(`-- Data export for all tables\n\n`);
    for (const table of tables) {
      console.log(`Exporting data for table: ${table.name}...`);
      
      try {
        // Get all records from table
        const records = await db.select().from(table.schema);
        
        // Write table header
        outputStream.write(`-- Table data: ${table.name}\n`);
        
        if (records.length > 0) {
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
        } else {
          outputStream.write(`-- No data in table: ${table.name}\n`);
        }
        
        outputStream.write(`\n`);
      } catch (error) {
        console.error(`Error exporting data from table ${table.name}:`, error);
        outputStream.write(`-- Error exporting data from table: ${table.name}\n\n`);
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

// ES modules don't support require.main === module check
// This will run only when imported, not executed directly

export { exportDatabase };