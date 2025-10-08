import dotenv from 'dotenv';
dotenv.config();

import { DatabaseStorage } from '../server/database-storage';

async function run() {
  const s = new DatabaseStorage();
  const arts = await s.getArticles();
  console.log('Articles:', arts.length);
  for (const a of arts) {
    console.log(`- ${a.id} ${a.slug} published=${a.isPublished} title(en)=${(a.title as any)?.en?.slice?.(0,80)}`);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });

