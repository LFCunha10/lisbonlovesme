import dotenv from 'dotenv';
dotenv.config();

import puppeteer from 'puppeteer';
import { DatabaseStorage } from '../server/database-storage';
import type { InsertArticle } from '../shared/schema';

type Locale = 'en' | 'pt' | 'ru';

function clean(text: string | undefined | null): string {
  return (text || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
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

async function scrollToLoadAll(page: puppeteer.Page, maxScrolls = 20) {
  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' as any }));
    await sleep(1500);
  }
}

async function extractPost(page: puppeteer.Page): Promise<{ title?: string; contentHtml?: string; featuredImage?: string; publishedAt?: string }>
{
  // Let Wix hydrate
  await page.waitForNetworkIdle({ idleTime: 1500, timeout: 60000 }).catch(() => {});
  await sleep(1500);
  // Provide __name helper if esbuild/tsx injected calls appear inside evaluated functions
  await page.addScriptTag({ content: 'window.__name = window.__name || ((f,n)=>f);' }).catch(() => {});

  const metaPublished = await page.evaluate(() => {
    const m = document.querySelector('meta[property="article:published_time"]') as HTMLMetaElement | null;
    return m?.content || undefined;
  });

  const title = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? (h1.textContent || '').trim() : undefined;
  });

  const featuredImage = await page.evaluate(() => {
    const og = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
    if (og?.content) return og.content;
    const imgs = Array.from(document.images) as HTMLImageElement[];
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

  const contentHtml = await page.evaluate(() => {
    const candidates: (Element | null)[] = [];
    candidates.push(document.querySelector('[data-hook="post-content"]'));
    candidates.push(document.querySelector('[data-testid="richContentRenderer"]'));
    candidates.push(document.querySelector('article'));
    candidates.push(document.querySelector('main'));
    let bestEl: Element | null = null;
    let bestScore = 0;
    const addCandidate = (el: Element | null) => { if (el) candidates.push(el); };
    const allDivs = Array.from(document.querySelectorAll('div, article, section'));
    for (const el of allDivs) {
      const pCount = el.querySelectorAll('p').length;
      if (pCount >= 4) addCandidate(el);
    }
    for (const el of candidates) {
      if (!el) continue;
      const text = (el as HTMLElement).innerText || '';
      const score = text.split(/\s+/).length;
      if (score > bestScore) { bestScore = score; bestEl = el; }
    }
    if (!bestEl) return undefined as any;
    const clone = bestEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style').forEach(n => n.remove());
    return clone.innerHTML;
  });

  return { title: clean(title), contentHtml: contentHtml || undefined, featuredImage, publishedAt: metaPublished };
}

function deriveLocaleUrl(baseUrl: string, locale: Locale) {
  // baseUrl is expected to be https://.../post/<slug> or with locale already
  const u = new URL(baseUrl);
  const parts = u.pathname.split('/').filter(Boolean);
  const i = parts.indexOf('post');
  if (i === -1 || i + 1 >= parts.length) return baseUrl;
  const slug = parts[i + 1];
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return `${u.origin}${prefix}/post/${slug}`;
}

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in environment');
    process.exit(1);
  }
  const storage = new DatabaseStorage();

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    const listingUrl = 'https://lisbonlovesme.wixsite.com/lisbonlovesme/blog';
    await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await scrollToLoadAll(page, 20);

    const links: string[] = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];
      const hrefs = anchors.map(a => a.href).filter(h => /\/post\//.test(h));
      return Array.from(new Set(hrefs));
    });

    // Reduce to unique slugs
    const slugs = Array.from(new Set(
      links.map(h => {
        try {
          const m = new URL(h).pathname.match(/\/post\/([^\/#?]+)/);
          return m ? decodeURIComponent(m[1]) : null;
        } catch { return null; }
      }).filter(Boolean) as string[]
    ));

    console.log(`Found ${slugs.length} post cards on listing page`);

    let processed = 0;
    for (const slug of slugs) {
      processed++;
      const finalSlug = slugify(slug);
      console.log(`\n[${processed}/${slugs.length}] Importing '${finalSlug}'`);

      const titles: Record<Locale, string> = { en: '', pt: '', ru: '' };
      const contents: Record<Locale, string> = { en: '', pt: '', ru: '' };
      const excerpts: Record<Locale, string> = { en: '', pt: '', ru: '' };
      let featuredImage: string | undefined;
      let publishedAt: Date | undefined;

      for (const locale of ['en', 'pt', 'ru'] as const) {
        const url = deriveLocaleUrl(`https://lisbonlovesme.wixsite.com/lisbonlovesme/post/${encodeURIComponent(slug)}`, locale);
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          const current = page.url();
          if (!new URL(current).pathname.includes(`/${encodeURIComponent(slug)}`)) {
            // Likely not available in this locale
            console.warn(` - ${locale}: variant missing`);
            continue;
          }
          const { title, contentHtml, featuredImage: og, publishedAt: meta } = await extractPost(page);
          if (title) titles[locale] = title;
          if (contentHtml) {
            contents[locale] = contentHtml;
            // basic excerpt from first 200 chars plain text
            const tmp = contentHtml.replace(/<[^>]+>/g, ' ');
            excerpts[locale] = clean(tmp).slice(0, 220);
          }
          if (!featuredImage && og) featuredImage = og;
          if (!publishedAt && meta) {
            const d = new Date(meta);
            if (!isNaN(d.getTime())) publishedAt = d;
          }
          console.log(` - ${locale}: ${title ? 'title' : 'no title'}, ${contentHtml ? 'content' : 'no content'}`);
        } catch (e: any) {
          console.warn(` - ${locale}: failed to load/extract (${e?.message || e})`);
        }
      }

      // Fallbacks
      titles.pt ||= titles.en;
      titles.ru ||= titles.en;
      contents.pt ||= contents.en;
      contents.ru ||= contents.en;
      excerpts.pt ||= excerpts.en;
      excerpts.ru ||= excerpts.en;

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
        // 32-bit safe sort order such that newer posts come first when sorted ascending
        sortOrder: publishedAt ? -Math.floor(publishedAt.getTime() / 1000) : 0,
        isPublished: true,
        publishedAt: publishedAt || new Date(),
      } as any;

      const existing = await storage.getArticleBySlug(finalSlug);
      if (existing) {
        console.log(` - Updating existing article id=${existing.id}`);
        await storage.updateArticle(existing.id, insert);
      } else {
        console.log(' - Creating new article');
        await storage.createArticle(insert);
      }
    }

    console.log('\nCard-based import completed.');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
