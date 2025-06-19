/**
 * Migration script to convert existing tours to multilingual format
 * This will be run manually to update the database schema
 */

import { db } from "./db.js";
import { tours } from "../shared/schema.js";

export async function migrateExistingToursToMultilingual() {
  console.log('Starting tour multilingual migration...');
  
  try {
    // Get current tours data before schema change
    const existingTours = await db.execute(`
      SELECT id, name, short_description, description, duration, difficulty, badge 
      FROM tours
    `);
    
    console.log(`Found ${existingTours.length} tours to migrate`);
    
    // For each tour, create multilingual structure
    for (const tour of existingTours) {
      const id = tour.id;
      const name = tour.name || 'Tour';
      const shortDescription = tour.short_description || '';
      const description = tour.description || 'Description';
      const duration = tour.duration || '2 hours';
      const difficulty = tour.difficulty || 'medium';
      const badge = tour.badge || '';
      
      console.log(`Migrating tour ${id}: ${name}`);
      
      // Create basic translations (user can improve these later)
      const multilingualData = {
        name: { en: name, pt: `[PT: ${name}]`, ru: `[RU: ${name}]` },
        shortDescription: { 
          en: shortDescription, 
          pt: `[PT: ${shortDescription}]`, 
          ru: `[RU: ${shortDescription}]` 
        },
        description: { en: description, pt: `[PT: ${description}]`, ru: `[RU: ${description}]` },
        duration: { en: duration, pt: duration, ru: duration },
        difficulty: { en: difficulty, pt: difficulty, ru: difficulty },
        badge: { en: badge, pt: badge, ru: badge }
      };
      
      // Update the tour with JSON data
      await db.execute(`
        UPDATE tours 
        SET 
          name = $1,
          short_description = $2,
          description = $3,
          duration = $4,
          difficulty = $5,
          badge = $6
        WHERE id = $7
      `, [
        JSON.stringify(multilingualData.name),
        JSON.stringify(multilingualData.shortDescription),
        JSON.stringify(multilingualData.description),
        JSON.stringify(multilingualData.duration),
        JSON.stringify(multilingualData.difficulty),
        JSON.stringify(multilingualData.badge),
        id
      ]);
      
      console.log(`Tour ${id} migrated successfully`);
    }
    
    console.log('All tours migrated to multilingual format');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}