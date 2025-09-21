import dotenv from 'dotenv';
dotenv.config();

import puppeteer from 'puppeteer';
import { load as cheerioLoad } from 'cheerio';
import { DatabaseStorage } from '../server/database-storage';
import type { InsertArticle } from '../shared/schema';

type Locale = 'en' | 'pt' | 'ru';

/**
 * Normalize whitespace
 */
function clean(text: string | undefined | null): string {
  return (text || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert any string into a URL-safe slug
 */
function slugify(input: string): string {
  const s = (input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'post';
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Extract the main content HTML from a Wix blog post.
 * Uses several heuristics to find the blog article container.
 */
async function extractPost(page: puppeteer.Page): Promise<{ title?: string; contentHtml?: string; featuredImage?: string; }> {
  // Wait for the page to settle; Wix can hydrate late
  await page.waitForNetworkIdle({ idleTime: 1500, timeout: 60000 }).catch(() => {});
  await sleep(2000);

  const title = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? (h1.textContent || '').trim() : undefined;
  });

  const featuredImage = await page.evaluate(() => {
    const og = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
    if (og?.content) return og.content;
    const imgs = Array.from(document.images) as HTMLImageElement[];
    // Pick the largest image near the top
    let best: { score: number; src: string } | null = null;
    for (const img of imgs) {
      const rect = img.getBoundingClientRect();
      const area = Math.max(0, rect.width) * Math.max(0, rect.height);
      const score = area - Math.max(0, rect.top);
      const src = (img.currentSrc || img.src || '').trim();
      if (!src || src.startsWith('data:')) continue;
      if (!best || score > best.score) best = { score, src };
    }
    return best?.src;
  });

  // Try specific selectors known for Wix blog
  const contentHtml = await page.evaluate(() => {
    const candidates: (Element | null)[] = [];
    candidates.push(document.querySelector('[data-hook="post-content"]'));
    candidates.push(document.querySelector('[data-testid="richContentRenderer"]'));
    candidates.push(document.querySelector('article'));
    candidates.push(document.querySelector('main'));
    // Find the element with the most text among candidates and reasonable fallbacks
    let bestEl: Element | null = null;
    let bestScore = 0;

    const addCandidate = (el: Element | null) => { if (el) candidates.push(el); };
    // Also scan for elements that contain many paragraphs
    const allDivs = Array.from(document.querySelectorAll('div, article, section')); 
    for (const el of allDivs) {
      const pCount = el.querySelectorAll('p').length;
      if (pCount >= 4) addCandidate(el);
    }

    for (const el of candidates) {
      if (!el) continue;
      const text = (el as HTMLElement).innerText || '';
      const score = text.split(/\s+/).length;
      if (score > bestScore) {
        bestScore = score;
        bestEl = el;
      }
    }
    if (!bestEl) return undefined as any;

    // Clean up the HTML: remove scripts and styles within the selection
    const clone = bestEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style').forEach(n => n.remove());
    return clone.innerHTML;
  });

  return { title: clean(title), contentHtml: contentHtml || undefined, featuredImage };
}

/**
 * Fetch the Wix blog RSS and group items by base slug.
 */
async function fetchRssClusters(rssUrl: string) {
  const res = await fetch(rssUrl);
  if (!res.ok) throw new Error(`Failed to fetch RSS: ${res.status}`);
  const xml = await res.text();
  const $ = cheerioLoad(xml, { xmlMode: true });
  const items: { title: string; link: string; description: string; pubDate?: string }[] = [];
  $('item').each((_i, el) => {
    const title = $(el).find('title').text().trim();
    const link = $(el).find('link').text().trim();
    const description = $(el).find('description').text().trim();
    const pubDate = $(el).find('pubDate').text().trim();
    if (link) items.push({ title, link, description, pubDate });
  });

  type Cluster = {
    baseSlug: string; // slug part after /post/
    byLocale: Partial<Record<Locale, { title: string; url: string; description: string; pubDate?: string }>>;
  };

  const clusters = new Map<string, Cluster>();
  for (const it of items) {
    const m = it.link.match(/\/post\/([^\?\#]+)$/);
    if (!m) continue;
    const rawSlug = decodeURIComponent(m[1]);
    const baseSlug = rawSlug; // keep original; we'll pick EN for final slug
    const locale: Locale = it.link.includes('/pt/') ? 'pt' : it.link.includes('/ru/') ? 'ru' : 'en';

    const c = clusters.get(baseSlug) || { baseSlug, byLocale: {} };
    c.byLocale[locale] = { title: it.title, url: it.link, description: it.description, pubDate: it.pubDate };
    clusters.set(baseSlug, c);
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
  if (clusters.length === 0) {
    console.error('No blog posts found in RSS feed');
    process.exit(1);
  }
  console.log(`Found ${clusters.length} blog post entries (grouped by base slug).`);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    // We'll open a fresh page per locale to avoid frame detachment issues
    let processed = 0;
    for (const cluster of clusters) {
      processed++;
      const en = cluster.byLocale.en;
      const pt = cluster.byLocale.pt;
      const ru = cluster.byLocale.ru;

      const slugBase = en?.url?.match(/\/post\/([^\/#?]+)/)?.[1]
        || pt?.url?.match(/\/post\/([^\/#?]+)/)?.[1]
        || ru?.url?.match(/\/post\/([^\/#?]+)/)?.[1]
        || cluster.baseSlug;
      const finalSlug = slugify(decodeURIComponent(slugBase));

      console.log(`\n[${processed}/${clusters.length}] Importing '${finalSlug}'`);
      const titles: Record<Locale, string> = { en: '', pt: '', ru: '' };
      const contents: Record<Locale, string> = { en: '', pt: '', ru: '' };
      const excerpts: Record<Locale, string> = { en: '', pt: '', ru: '' };
      let featuredImage: string | undefined;
      let publishedAt: Date | undefined = undefined;

      for (const locale of ['en', 'pt', 'ru'] as const) {
        const entry = cluster.byLocale[locale];
        if (!entry?.url) continue;
        const p = await browser.newPage();
        try {
          await p.goto(entry.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          // Workaround for esbuild/tsx helper used in evaluated functions
          await p.addScriptTag({ content: 'window.__name = window.__name || ((f,n)=>f);' }).catch(() => {});
          const { title, contentHtml, featuredImage: og } = await extractPost(p);
          if (title) titles[locale] = title;
          if (contentHtml) contents[locale] = contentHtml;
          if (entry.description) excerpts[locale] = clean(entry.description);
          if (!featuredImage && og) featuredImage = og;
          if (!publishedAt && entry.pubDate) publishedAt = new Date(entry.pubDate);
          console.log(` - ${locale}: ${title ? 'title' : 'no title'}, ${contentHtml ? 'content' : 'no content'}`);
        } catch (e: any) {
          console.warn(` - ${locale}: failed to load/extract (${e?.message || e})`);
        } finally {
          await p.close().catch(() => {});
        }
      }

      // Fallbacks to EN where missing
      titles.pt ||= titles.en;
      titles.ru ||= titles.en;
      contents.pt ||= contents.en;
      contents.ru ||= contents.en;
      excerpts.pt ||= excerpts.en;
      excerpts.ru ||= excerpts.en;

      // If still no content, skip
      const hasContent = contents.en || contents.pt || contents.ru;
      if (!hasContent) {
        console.warn(` ! Skipping '${finalSlug}' — no content extracted`);
        continue;
      }

      const insert: InsertArticle = {
        title: { en: titles.en, pt: titles.pt, ru: titles.ru } as any,
        slug: finalSlug,
        content: { en: contents.en, pt: contents.pt, ru: contents.ru } as any,
        excerpt: { en: excerpts.en, pt: excerpts.pt, ru: excerpts.ru } as any,
        featuredImage: featuredImage || null as any,
        parentId: null as any,
        sortOrder: publishedAt ? -Math.floor(publishedAt.getTime() / 1000) : 0,
        isPublished: true,
        publishedAt: publishedAt || new Date(),
      } as any;

      // Upsert by slug
      const existing = await storage.getArticleBySlug(finalSlug);
      if (existing) {
        console.log(` - Updating existing article id=${existing.id}`);
        await storage.updateArticle(existing.id, insert);
      } else {
        console.log(' - Creating new article');
        await storage.createArticle(insert);
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
