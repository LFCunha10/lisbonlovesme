import fs from 'fs';
import path from 'path';
import { db, pool } from '../db';
import * as schema from '@shared/schema';

/**
 * Creates a SQL string with all database schema and data
 * Ready to be imported elsewhere
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
    
    // Collect all data first
    const dataExport = [];
    
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
    for (const table of tables) {
      console.log(`Exporting table: ${table.name}...`);
      
      try {
        // Get all records from table
        const records = await db.select().from(table.schema);
        
        // Table header
        dataExport.push(`-- Table: ${table.name}`);
        
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
            dataExport.push(`INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
          }
        } else {
          dataExport.push(`-- No data in table: ${table.name}`);
        }
        
        dataExport.push('');
      } catch (error) {
        console.error(`Error exporting data from table ${table.name}:`, error);
        dataExport.push(`-- Error exporting data from table: ${table.name}`);
        dataExport.push('');
      }
    }
    
    // Now create the complete SQL file with schema and data
    const sqlContent = `-- Lisbonlovesme Database Export
-- Date: ${new Date().toISOString()}

-- This SQL file contains all schema and data for the Lisbonlovesme tour booking application.
-- It can be imported to a fresh PostgreSQL database to recreate the entire application database.

BEGIN;

-- ===================================
-- SCHEMA CREATION STATEMENTS
-- ===================================

-- Users table schema
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Tours table schema
DROP TABLE IF EXISTS tours CASCADE;
CREATE TABLE tours (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_description TEXT DEFAULT '',
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  duration TEXT NOT NULL,
  max_group_size INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  price INTEGER NOT NULL,
  badge TEXT,
  badge_color TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Availabilities table schema
DROP TABLE IF EXISTS availabilities CASCADE;
CREATE TABLE availabilities (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  max_spots INTEGER NOT NULL,
  spots_left INTEGER NOT NULL
);

-- Bookings table schema
DROP TABLE IF EXISTS bookings CASCADE;
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  availability_id INTEGER NOT NULL REFERENCES availabilities(id) ON DELETE CASCADE,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  number_of_participants INTEGER NOT NULL,
  special_requests TEXT,
  booking_reference TEXT NOT NULL UNIQUE,
  total_amount INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  additional_info JSONB,
  meeting_point TEXT,
  reminders_sent BOOLEAN DEFAULT FALSE
);

-- Testimonials table schema
DROP TABLE IF EXISTS testimonials CASCADE;
CREATE TABLE testimonials (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_country TEXT NOT NULL,
  rating INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE
);

-- Closed Days table schema
DROP TABLE IF EXISTS closed_days CASCADE;
CREATE TABLE closed_days (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Settings table schema
DROP TABLE IF EXISTS admin_settings CASCADE;
CREATE TABLE admin_settings (
  id SERIAL PRIMARY KEY,
  auto_close_day BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- ===================================
-- DATA EXPORT FOR ALL TABLES
-- ===================================

${dataExport.join('\n')}

COMMIT;`;

    // Write to file
    fs.writeFileSync(exportPath, sqlContent);
    
    console.log(`Database export completed successfully!`);
    console.log(`Export file saved to: ${exportPath}`);
    
    return exportPath;
  } catch (error) {
    console.error('Database export failed:', error);
    throw error;
  }
}

export { exportDatabase };