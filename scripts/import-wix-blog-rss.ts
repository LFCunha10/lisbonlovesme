import dotenv from 'dotenv';
dotenv.config();

import { load as cheerioLoad } from 'cheerio';
import { DatabaseStorage } from '../server/database-storage';
import type { InsertArticle } from '../shared/schema';

type Locale = 'en' | 'pt' | 'ru';

function clean(text: string | undefined | null): string {
  return (text || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(input: string): string {
  const s = (input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'post';
}

async function fetchRssClusters(rssUrl: string) {
  const res = await fetch(rssUrl);
  if (!res.ok) throw new Error(`Failed to fetch RSS: ${res.status}`);
  const xml = await res.text();
  const $ = cheerioLoad(xml, { xmlMode: true });

  type Item = { title: string; link: string; description: string; pubDate?: string; image?: string };
  const items: Item[] = [];
  $('item').each((_i, el) => {
    const title = $(el).find('title').text().trim();
    const link = $(el).find('link').text().trim();
    const description = $(el).find('description').text().trim();
    const pubDate = $(el).find('pubDate').text().trim();
    const enclosureUrl = $(el).find('enclosure').attr('url');
    if (link) items.push({ title, link, description, pubDate, image: enclosureUrl });
  });

  type Cluster = {
    key: string; // grouping key (image URL or fallback slug)
    byLocale: Partial<Record<Locale, Item>>;
    items: Item[];
  };

  const clusters = new Map<string, Cluster>();
  for (const it of items) {
    const m = it.link.match(/\/post\/([^\?\#]+)$/);
    if (!m) continue;
    const rawSlug = decodeURIComponent(m[1]);
    const groupKey = it.image ? `img:${it.image}` : `slug:${rawSlug}`;
    const locale: Locale = it.link.includes('/pt/') ? 'pt' : it.link.includes('/ru/') ? 'ru' : 'en';
    const c = clusters.get(groupKey) || { key: groupKey, byLocale: {}, items: [] };
    c.byLocale[locale] = it;
    c.items.push(it);
    clusters.set(groupKey, c);
  }

  return Array.from(clusters.values());
}

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in environment');
    process.exit(1);
  }

  const storage = new DatabaseStorage();
  const rssUrl = 'https://lisbonlovesme.wixsite.com/lisbonlovesme/blog-feed.xml';
  const clusters = await fetchRssClusters(rssUrl);
  console.log(`Found ${clusters.length} blog items`);

  let processed = 0;
  for (const cluster of clusters) {
    processed++;
    const en = cluster.byLocale.en;
    const pt = cluster.byLocale.pt;
    const ru = cluster.byLocale.ru;

    const slugBase = en?.link?.match(/\/post\/([^\/#?]+)/)?.[1]
      || pt?.link?.match(/\/post\/([^\/#?]+)/)?.[1]
      || ru?.link?.match(/\/post\/([^\/#?]+)/)?.[1]
      || cluster.items[0]?.link?.match(/\/post\/([^\/#?]+)/)?.[1]
      || 'post';
    const finalSlug = slugify(decodeURIComponent(slugBase));

    const titles = {
      en: clean(en?.title) || clean(pt?.title) || clean(ru?.title) || finalSlug.replace(/-/g, ' '),
      pt: clean(pt?.title) || clean(en?.title) || clean(ru?.title) || finalSlug.replace(/-/g, ' '),
      ru: clean(ru?.title) || clean(en?.title) || clean(pt?.title) || finalSlug.replace(/-/g, ' '),
    };
    const excerpts = {
      en: clean(en?.description) || '',
      pt: clean(pt?.description) || clean(en?.description) || '',
      ru: clean(ru?.description) || clean(en?.description) || '',
    };
    const featured = en?.image || pt?.image || ru?.image || cluster.items[0]?.image || null;
    const publishedAt = en?.pubDate || pt?.pubDate || ru?.pubDate;

    // Use excerpt as content for now (Puppeteer required for full content)
    const contents = {
      en: excerpts.en,
      pt: excerpts.pt,
      ru: excerpts.ru,
    };

    const insert: InsertArticle = {
      title: titles as any,
      slug: finalSlug,
      content: contents as any,
      excerpt: excerpts as any,
      featuredImage: featured as any,
      parentId: null as any,
      // Use negative epoch seconds to get newest first when sorted ascending, fits 32-bit int
      sortOrder: publishedAt ? -Math.floor(new Date(publishedAt).getTime() / 1000) : 0,
      isPublished: true,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    } as any;

    const existing = await storage.getArticleBySlug(finalSlug);
    if (existing) {
      console.log(`[${processed}/${clusters.length}] update: ${finalSlug}`);
      await storage.updateArticle(existing.id, insert);
    } else {
      console.log(`[${processed}/${clusters.length}] create: ${finalSlug}`);
      await storage.createArticle(insert);
    }
  }

  console.log('RSS import completed.');
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
