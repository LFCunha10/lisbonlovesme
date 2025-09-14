import { MemStorage } from "./storage";
import { db } from "./db";
import { tours, availabilities, testimonials } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * This script migrates data from the in-memory storage to the database
 * It will populate the database with sample tours, availabilities, and testimonials
 */
async function migrateData() {
}
export default migrateData;
