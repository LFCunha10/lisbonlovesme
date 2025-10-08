import dotenv from 'dotenv';
dotenv.config();

import { DatabaseStorage } from '../server/database-storage';

async function run() {
  const storage = new DatabaseStorage();
  const articles = await storage.getArticles();
  let deleted = 0;
  for (const a of articles) {
    const titleEn = (a.title as any)?.en || '';
    const is404 = /^\s*404\b/i.test(titleEn) || /Page Not Found/i.test(titleEn);
    const badSlug = ['post','28','5'].includes(a.slug);
    if (is404 || badSlug) {
      await storage.deleteArticle(a.id);
      console.log(`Deleted id=${a.id} slug=${a.slug} title(en)=${titleEn}`);
      deleted++;
    }
  }
  console.log(`Cleanup complete. Deleted ${deleted} articles.`);
}

run().catch((e) => { console.error(e); process.exit(1); });

