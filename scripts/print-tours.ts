import dotenv from 'dotenv';
dotenv.config();

import { DatabaseStorage } from '../server/database-storage';

async function run() {
  const storage = new DatabaseStorage();
  const tours = await storage.getAllTours();
  for (const t of tours) {
    const name = (t.name as any)?.en || JSON.stringify(t.name);
    console.log(`#${t.id}: ${name} · price=${t.price} · priceType=${t.priceType} · maxGroup=${t.maxGroupSize}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

