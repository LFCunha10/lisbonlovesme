import { MemStorage } from "./storage";
import { db } from "./db";
import { tours, availabilities, testimonials } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * This script migrates data from the in-memory storage to the database
 * It will populate the database with sample tours, availabilities, and testimonials
 */
async function migrateData() {
  console.log("Starting data migration to database...");
  
  // Create a temporary instance of the MemStorage to get sample data
  const memStorage = new MemStorage();
  
  try {
    // 1. Migrate Tours
    const toursData = await memStorage.getTours();
    console.log(`Migrating ${toursData.length} tours...`);
    
    for (const tour of toursData) {
      // Check if tour already exists to avoid duplicates
      const existingTours = await db.select().from(tours).where(eq(tours.name, tour.name));
      if (existingTours.length === 0) {
        await db.insert(tours).values({
          name: tour.name,
          description: tour.description,
          imageUrl: tour.imageUrl,
          duration: tour.duration,
          maxGroupSize: tour.maxGroupSize,
          difficulty: tour.difficulty,
          price: tour.price,
          badge: tour.badge,
          badgeColor: tour.badgeColor,
          isActive: tour.isActive
        });
      }
    }
    
    // 2. Migrate Availabilities
    const availabilitiesData = await memStorage.getAvailabilities();
    console.log(`Migrating ${availabilitiesData.length} availabilities...`);
    
    for (const availability of availabilitiesData) {
      // Get the corresponding tour from the database
      const tourData = await memStorage.getTour(availability.tourId);
      const [dbTour] = await db.select().from(tours).where(eq(tours.name, tourData?.name || ''));
      
      if (dbTour) {
        // Check if availability already exists
        const existingAvail = await db.select().from(availabilities).where(
          and(
            eq(availabilities.tourId, dbTour.id),
            eq(availabilities.date, availability.date),
            eq(availabilities.time, availability.time)
          )
        );
        
        if (existingAvail.length === 0) {
          await db.insert(availabilities).values({
            tourId: dbTour.id,
            date: availability.date,
            time: availability.time,
            maxSpots: availability.maxSpots,
            spotsLeft: availability.spotsLeft
          });
        }
      }
    }
    
    // 3. Migrate Testimonials
    const testimonialsData = await memStorage.getTestimonials();
    console.log(`Migrating ${testimonialsData.length} testimonials...`);
    
    for (const testimonial of testimonialsData) {
      // Get the corresponding tour from the database
      const tourData = await memStorage.getTour(testimonial.tourId);
      const [dbTour] = await db.select().from(tours).where(eq(tours.name, tourData?.name || ''));
      
      if (dbTour) {
        // Check if testimonial already exists
        const existingTestimonials = await db.select().from(testimonials).where(
          and(
            eq(testimonials.tourId, dbTour.id),
            eq(testimonials.customerName, testimonial.customerName),
            eq(testimonials.text, testimonial.text)
          )
        );
        
        if (existingTestimonials.length === 0) {
          await db.insert(testimonials).values({
            tourId: dbTour.id,
            customerName: testimonial.customerName,
            customerCountry: testimonial.customerCountry,
            rating: testimonial.rating,
            text: testimonial.text,
            isApproved: true // Assume the sample testimonials are approved
          });
        }
      }
    }
    
    console.log("Data migration completed successfully!");
  } catch (error) {
    console.error("Error during data migration:", error);
    throw error;
  }
}

// Export the migration function to be called during server startup
export default migrateData;