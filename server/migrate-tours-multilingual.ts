/**
 * Migration script to convert existing tours to multilingual format
 */

import { db } from "./db.js";
import { tours } from "../shared/schema.js";
import { autoTranslateTourContent } from "./translation-service.js";
import { eq } from "drizzle-orm";

export async function migrateTourToMultilingual() {
  console.log('Starting tour multilingual migration...');
  
  try {
    // Get all existing tours
    const existingTours = await db.select().from(tours);
    console.log(`Found ${existingTours.length} tours to migrate`);
    
    for (const tour of existingTours) {
      // Check if tour is already multilingual
      if (typeof tour.name === 'object' && tour.name.en) {
        console.log(`Tour ${tour.id} already multilingual, skipping`);
        continue;
      }
      
      console.log(`Migrating tour ${tour.id}...`);
      
      // Convert legacy string fields to multilingual
      const legacyName = typeof tour.name === 'string' ? tour.name : 'Tour';
      const legacyShortDesc = typeof tour.shortDescription === 'string' ? tour.shortDescription : '';
      const legacyDesc = typeof tour.description === 'string' ? tour.description : 'Description';
      const legacyDuration = typeof tour.duration === 'string' ? tour.duration : '2 hours';
      const legacyDifficulty = typeof tour.difficulty === 'string' ? tour.difficulty : 'medium';
      const legacyBadge = typeof tour.badge === 'string' ? tour.badge : '';
      
      // Auto-translate the content
      const translations = await autoTranslateTourContent({
        name: legacyName,
        shortDescription: legacyShortDesc,
        description: legacyDesc,
        duration: legacyDuration,
        difficulty: legacyDifficulty,
        badge: legacyBadge
      });
      
      // Update the tour with multilingual content
      await db.update(tours)
        .set({
          name: translations.name,
          shortDescription: translations.shortDescription,
          description: translations.description,
          duration: translations.duration,
          difficulty: translations.difficulty,
          badge: translations.badge
        })
        .where(eq(tours.id, tour.id));
      
      console.log(`Tour ${tour.id} migrated successfully`);
    }
    
    console.log('Tour multilingual migration completed successfully');
  } catch (error) {
    console.error('Tour migration failed:', error);
    throw error;
  }
}