import dotenv from 'dotenv';
dotenv.config();

import puppeteer from 'puppeteer';
import { load as cheerioLoad } from 'cheerio';

// Import storage using project code
import { DatabaseStorage } from '../server/database-storage';
import type { InsertTour } from '../shared/schema';

type Locale = 'en' | 'pt' | 'ru';

/**
 * Helper to trim and normalize whitespace
 */
function clean(text: string | undefined | null): string {
  return (text || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract the best hero image URL from the page
 */
async function extractHeroImage(page: puppeteer.Page): Promise<string | undefined> {
  const src = await page.evaluate(() => {
    // Prefer largest visible image near top of page
    const images = Array.from(document.images) as HTMLImageElement[];
    if (!images.length) return undefined as any;

    const scored = images.map(img => {
      const rect = img.getBoundingClientRect();
      const area = Math.max(0, rect.width) * Math.max(0, rect.height);
      const distanceFromTop = Math.max(0, rect.top);
      const score = area - distanceFromTop; // bigger and nearer to top is better
      return { img, score };
    });

    scored.sort((a, b) => b.score - a.score);
    for (const s of scored) {
      const src = (s.img.currentSrc || s.img.src || '').trim();
      if (src && !src.startsWith('data:')) return src;
    }
    return undefined as any;
  });
  return src || undefined;
}

/**
 * Extract text by scanning the whole visible page text for labels
 */
async function extractFields(page: puppeteer.Page, locale: Locale) {
  const result: {
    title?: string;
    duration?: string;
    priceValue?: number;
    priceText?: string;
    priceType?: 'per_person' | 'per_group';
    difficulty?: string;
    groupSize?: number;
    description?: string;
  } = {};

  // H1 as title
  result.title = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent?.trim() || undefined : undefined;
  });

  // Visible text of the whole page
  const bodyText: string = await page.evaluate(() => document.body?.innerText || '');

  // Locale-specific labels
  const LABELS = {
    en: {
      duration: ['Duration'],
      price: ['Price'],
      perPerson: ['per person', '/person'],
      perGroup: ['per group', '/group'],
      group: ['Group Size', 'Max group size'],
      difficulty: ['Difficulty'],
    },
    pt: {
      duration: ['Duração'],
      price: ['Preço'],
      perPerson: ['por pessoa', '/pessoa'],
      perGroup: ['por grupo', '/grupo'],
      group: ['Tamanho do grupo', 'Grupo'],
      difficulty: ['Dificuldade'],
    },
    ru: {
      duration: ['Продолжительность'],
      price: ['Цена'],
      perPerson: ['за человека', '/чел', 'на человека'],
      perGroup: ['за группу', '/группа', '/группу'],
      group: ['Размер группы', 'Группа'],
      difficulty: ['Сложность'],
    },
  } as const;

  const labels = LABELS[locale];

  // Duration
  {
    const re = new RegExp(`(?:${labels.duration.map(l => l.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\s*[\:\-]?\s*([^\n]+)`, 'i');
    const m = bodyText.match(re);
    if (m) result.duration = clean(m[1]);
  }

  // Price and price type
  {
    // Try label-based first
    const priceLabel = new RegExp(`(?:${labels.price.map(l => l.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\s*[\:\-]?\s*([^\n]+)`, 'i');
    const m = bodyText.match(priceLabel);
    const candidate = m ? m[1] : bodyText;
    // Try to find a euro price in the candidate scope
    const euro = /€\s*([0-9]+(?:[\.,][0-9]{2})?)/.exec(candidate);
    if (euro) {
      const num = euro[1].replace(',', '.');
      const euros = parseFloat(num);
      if (!isNaN(euros)) {
        result.priceValue = Math.round(euros * 100);
        result.priceText = clean(m ? m[1] : euro[0]);
      }
    }
    const candidateLower = candidate.toLowerCase();
    if (labels.perGroup.some(s => candidateLower.includes(s))) result.priceType = 'per_group';
    if (labels.perPerson.some(s => candidateLower.includes(s))) result.priceType = result.priceType || 'per_person';
  }

  // Difficulty
  {
    const re = new RegExp(`(?:${labels.difficulty.map(l => l.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\s*[\:\-]?\s*([^\n]+)`, 'i');
    const m = bodyText.match(re);
    if (m) result.difficulty = clean(m[1]);
  }

  // Group size
  {
    const re = new RegExp(`(?:${labels.group.map(l => l.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\s*[\:\-]?\s*([^\n]+)`, 'i');
    const m = bodyText.match(re);
    if (m) {
      const text = m[1];
      const num = /([0-9]{1,3})/.exec(text);
      if (num) result.groupSize = parseInt(num[1], 10);
    }
  }

  // Description: concatenate long paragraphs (filter nav/footer noise)
  result.description = await page.evaluate(() => {
    const blocks: string[] = [];
    const paras = Array.from(document.querySelectorAll('p')) as HTMLParagraphElement[];
    for (const p of paras) {
      const text = (p.innerText || '').trim();
      if (text.length >= 60) blocks.push(text);
    }
    // Fallback: take main text by longest chunk
    if (blocks.length === 0) {
      const full = (document.body?.innerText || '').split('\n').map(l => l.trim()).filter(Boolean);
      const sorted = full.sort((a, b) => b.length - a.length);
      return sorted.slice(0, 5).join('\n\n');
    }
    return blocks.join('\n\n');
  });

  return result;
}

/**
 * Parse the pages sitemap and collect tour slugs
 */
async function fetchTourSlugs(): Promise<string[]> {
  const res = await fetch('https://www.lisbonlovesme.com/pages-sitemap.xml');
  if (!res.ok) throw new Error(`Failed to load pages-sitemap.xml: ${res.status}`);
  const xml = await res.text();
  const $ = cheerioLoad(xml, { xmlMode: true });
  const slugs: string[] = [];
  $('url > loc').each((_i, el) => {
    const loc = $(el).text();
    const m = loc.match(/https:\/\/www\.lisbonlovesme\.com\/(?:[a-z]{2}\/)?tours\/([^\/]+)$/i);
    if (m) {
      const slug = m[1];
      // Ignore booking pages (they include /book-...)
      if (!slug.startsWith('book-')) slugs.push(slug);
    }
  });
  // De-duplicate
  return Array.from(new Set(slugs));
}

async function run() {
  // Ensure DB URL is present
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in environment');
    process.exit(1);
  }

  const storage = new DatabaseStorage();

  const slugs = await fetchTourSlugs();
  if (slugs.length === 0) {
    console.error('No tour slugs found in sitemap.');
    process.exit(1);
  }
  console.log(`Found ${slugs.length} tour slugs:`, slugs.join(', '));

  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    for (const slug of slugs) {
      console.log(`\nProcessing tour '${slug}'`);
      const dataByLocale: Record<Locale, Awaited<ReturnType<typeof extractFields>> & { image?: string }> = {
        en: { title: undefined, duration: undefined, priceValue: undefined, priceText: undefined, priceType: undefined, difficulty: undefined, groupSize: undefined, description: undefined, image: undefined },
        pt: { title: undefined, duration: undefined, priceValue: undefined, priceText: undefined, priceType: undefined, difficulty: undefined, groupSize: undefined, description: undefined, image: undefined },
        ru: { title: undefined, duration: undefined, priceValue: undefined, priceText: undefined, priceType: undefined, difficulty: undefined, groupSize: undefined, description: undefined, image: undefined },
      };

      for (const locale of ['en', 'pt', 'ru'] as const) {
        const prefix = locale === 'en' ? '' : `/${locale}`;
        const url = `https://www.lisbonlovesme.com${prefix}/tours/${slug}`;
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
          const finalUrl = page.url();
          if (!finalUrl.includes(`/${slug}`)) {
            console.warn(`   · Skipping ${locale} due to redirect to different page: ${finalUrl}`);
            continue;
          }
          // Some wix content hydrates a bit later
          await new Promise((r) => setTimeout(r, 3000));
          const fields = await extractFields(page, locale);
          const image = await extractHeroImage(page);
          dataByLocale[locale] = { ...fields, image };
          console.log(` - ${locale}: title='${clean(fields.title)}' duration='${clean(fields.duration)}' price='${fields.priceValue ?? ''}' type='${fields.priceType ?? ''}'`);
        } catch (e) {
          console.warn(` - ${locale}: failed to extract (${(e as Error).message})`);
        }
      }

      // Build multilingual fields
      const name = {
        en: clean(dataByLocale.en.title) || slug.replace(/-/g, ' '),
        pt: clean(dataByLocale.pt.title) || clean(dataByLocale.en.title) || slug.replace(/-/g, ' '),
        ru: clean(dataByLocale.ru.title) || clean(dataByLocale.en.title) || slug.replace(/-/g, ' '),
      };
      const duration = {
        en: clean(dataByLocale.en.duration) || '',
        pt: clean(dataByLocale.pt.duration) || clean(dataByLocale.en.duration) || '',
        ru: clean(dataByLocale.ru.duration) || clean(dataByLocale.en.duration) || '',
      };
      const difficulty = {
        en: clean(dataByLocale.en.difficulty) || '',
        pt: clean(dataByLocale.pt.difficulty) || clean(dataByLocale.en.difficulty) || '',
        ru: clean(dataByLocale.ru.difficulty) || clean(dataByLocale.en.difficulty) || '',
      };
      const description = {
        en: clean(dataByLocale.en.description) || '',
        pt: clean(dataByLocale.pt.description) || clean(dataByLocale.en.description) || '',
        ru: clean(dataByLocale.ru.description) || clean(dataByLocale.en.description) || '',
      };
      const shortDescription = {
        en: (description.en || '').split(/\n+/).slice(0, 2).join(' ').slice(0, 220),
        pt: (description.pt || '').split(/\n+/).slice(0, 2).join(' ').slice(0, 220),
        ru: (description.ru || '').split(/\n+/).slice(0, 2).join(' ').slice(0, 220),
      };

      // Choose image: prefer en image, then others
      const imageUrl = dataByLocale.en.image || dataByLocale.pt.image || dataByLocale.ru.image || '';

      // Price: prefer en value
      const price = dataByLocale.en.priceValue || dataByLocale.pt.priceValue || dataByLocale.ru.priceValue || 0;
      const priceType = (dataByLocale.en.priceType || dataByLocale.pt.priceType || dataByLocale.ru.priceType) || 'per_person';

      // Group size: prefer parsed value; fallback to 10 when unknown
      const maxGroupSize = dataByLocale.en.groupSize || dataByLocale.pt.groupSize || dataByLocale.ru.groupSize || 10;

      const insert: InsertTour = {
        name,
        shortDescription,
        description,
        imageUrl: imageUrl,
        duration,
        maxGroupSize,
        difficulty,
        price,
        priceType,
        badge: { en: '', pt: '', ru: '' },
        badgeColor: null as any,
        isActive: true,
      } as any;

      // Check if a tour with same English name exists; if so, update it
      const existing = (await storage.getAllTours()).find(t => (t.name as any)?.en?.toLowerCase?.() === name.en.toLowerCase());
      if (existing) {
        console.log(` - Updating existing tour id=${existing.id} (${name.en})`);
        await storage.updateTour(existing.id, insert);
      } else {
        console.log(` - Creating new tour (${name.en})`);
        await storage.createTour(insert);
      }
    }

    console.log('\nImport completed.');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
