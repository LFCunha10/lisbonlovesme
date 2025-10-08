import dotenv from 'dotenv';
dotenv.config();

import puppeteer from 'puppeteer';
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

function sleep(ms: number) { return new Promise((res) => setTimeout(res, ms)); }

async function extractPost(page: puppeteer.Page): Promise<{ title?: string; contentHtml?: string; featuredImage?: string; publishedAt?: string }>
{
  await page.waitForNetworkIdle({ idleTime: 1500, timeout: 60000 }).catch(() => {});
  await sleep(1500);
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
  const u = new URL(baseUrl);
  const parts = u.pathname.split('/').filter(Boolean);
  const i = parts.indexOf('post');
  if (i === -1 || i + 1 >= parts.length) return baseUrl;
  const slug = parts[i + 1];
  // Preserve the site name segment (e.g., 'lisbonlovesme') and swap locale segment
  const siteName = i > 0 ? parts[0] : undefined;
  const segments = [
    ...(siteName ? [siteName] : []),
    ...(locale === 'en' ? [] : [locale]),
    'post',
    slug,
  ];
  return `${u.origin}/${segments.join('/')}`;
}

async function fetchMeta(url: string, locale: Locale) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': locale === 'pt' ? 'pt-PT,pt;q=0.9,en;q=0.8' : locale === 'ru' ? 'ru-RU,ru;q=0.9,en;q=0.8' : 'en-US,en;q=0.9',
      'Referer': 'https://lisbonlovesme.wixsite.com/lisbonlovesme/blog'
    }
  });
  const html = await res.text();
  const $ = cheerioLoad(html);
  const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
  const ogImage = $('meta[property="og:image"]').attr('content') || undefined;
  const published = $('meta[property="article:published_time"]').attr('content') || undefined;
  return { ogTitle, ogImage, published };
}

async function fetchReadableAsHtml(url: string) {
  // Use Jina AI readable proxy to get text, convert to simple HTML paragraphs
  const proxyUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`Readable fetch failed: ${res.status}`);
  const text = await res.text();
  const lines = text.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  // basic escaping for HTML special chars
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `<div>${lines.map(p => `<p>${esc(p)}</p>`).join('\n')}</div>`;
  return html;
}

async function buildRssIndex() {
  const rssUrl = 'https://lisbonlovesme.wixsite.com/lisbonlovesme/blog-feed.xml';
  const res = await fetch(rssUrl);
  const xml = await res.text();
  const $ = cheerioLoad(xml, { xmlMode: true });
  const bySlug: Record<string, { en?: string; pt?: string; ru?: string; image?: string; date?: string }> = {};
  $('item').each((_i, el) => {
    const link = $(el).find('link').text().trim();
    const title = $(el).find('title').text().trim();
    const image = $(el).find('enclosure').attr('url');
    const pubDate = $(el).find('pubDate').text().trim();
    const m = link.match(/\/post\/([^\?#]+)$/);
    if (!m) return;
    const slug = decodeURIComponent(m[1]);
    const rec = bySlug[slug] || {};
    if (link.includes('/pt/')) rec.pt = title;
    else if (link.includes('/ru/')) rec.ru = title;
    else rec.en = title;
    rec.image = rec.image || image;
    rec.date = rec.date || pubDate;
    bySlug[slug] = rec;
  });
  return bySlug;
}

const INPUT_URLS = [
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/lisboa-card-2025-your-key-to-lisbon',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/saint-anthony-s-festivities-in-lisbon-a-night-of-sardines-love-and-celebration',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/why-was-there-a-blackout-in-portugal-on-april-28-2025',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/the-national-palace-of-sintra-the-heart-of-portugal-s-royal-history',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/pena-palace-the-most-fairytale-like-castle-in-portugal',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/what-to-see-in-lisbon-in-one-day-the-ultimate-itinerary',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/5-must-see-lifts-and-elevators-in-lisbon-a-fun-and-scenic-way-to-explore-the-city',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/the-hidden-gems-of-lisbon-discover-the-authentic-side-of-portugal-s-capital',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/the-best-terraces-and-viewpoints-in-lisbon',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/top-5-places-to-visit-near-lisbon-in-2025',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/my-5-favorite-tascas-in-lisbon-for-2024',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/lisbon-travel-guide-2024-fresh-look',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/5-best-beaches-near-lisbon-you-must-visit',
  'https://lisbonlovesme.wixsite.com/lisbonlovesme/post/welcome-to-the-lisbonlovesme-com',
];

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in environment');
    process.exit(1);
  }
  const storage = new DatabaseStorage();
  const rssIndex = await buildRssIndex().catch(() => ({} as any));

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    let processed = 0;
    for (const baseUrl of INPUT_URLS) {
      processed++;
      const slug = baseUrl.match(/\/post\/([^\/#?]+)/)?.[1] || 'post';
      const finalSlug = slugify(decodeURIComponent(slug));
      console.log(`\n[${processed}/${INPUT_URLS.length}] Importing '${finalSlug}'`);

      const titles: Record<Locale, string> = { en: '', pt: '', ru: '' };
      const contents: Record<Locale, string> = { en: '', pt: '', ru: '' };
      const excerpts: Record<Locale, string> = { en: '', pt: '', ru: '' };
      let featuredImage: string | undefined;
      let publishedAt: Date | undefined;

      for (const locale of ['en', 'pt', 'ru'] as const) {
        const url = deriveLocaleUrl(baseUrl, locale);
        const page = await browser.newPage();
        try {
          const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
          await page.setUserAgent(ua);
          await page.setExtraHTTPHeaders({
            'Accept-Language': locale === 'pt' ? 'pt-PT,pt;q=0.9,en;q=0.8' : locale === 'ru' ? 'ru-RU,ru;q=0.9,en;q=0.8' : 'en-US,en;q=0.9',
            'Referer': 'https://lisbonlovesme.wixsite.com/lisbonlovesme/blog'
          });
          await page.setViewport({ width: 1366, height: 900 });
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
          let { title, contentHtml, featuredImage: og, publishedAt: meta } = await extractPost(page);
          // Fallback: if 404 or missing content, fetch via readable proxy + meta tags
          if (!contentHtml || title === '404' || (title && title.toLowerCase() === '404')) {
            const metaInfo = await fetchMeta(url, locale);
            title = title && title !== '404' ? title : (metaInfo.ogTitle || undefined);
            og = og || metaInfo.ogImage;
            meta = meta || metaInfo.published;
            try {
              contentHtml = await fetchReadableAsHtml(url);
            } catch (e) {
              console.warn(`   · readable fallback failed: ${(e as Error).message}`);
            }
          }

          if (title) titles[locale] = title;
          if (contentHtml) {
            contents[locale] = contentHtml;
            const tmp = contentHtml.replace(/<[^>]+>/g, ' ');
            excerpts[locale] = clean(tmp).slice(0, 220);
          }
          if (!featuredImage && og) featuredImage = og;
          if (!publishedAt && meta) {
            const d = new Date(meta);
            if (!isNaN(d.getTime())) publishedAt = d;
          }
          console.log(` - ${locale}: ${titles[locale] ? 'title' : 'no title'}, ${contents[locale] ? 'content' : 'no content'}`);
        } catch (e: any) {
          console.warn(` - ${locale}: failed to load/extract (${e?.message || e})`);
        } finally {
          await page.close().catch(() => {});
        }
      }

      // If any titles are missing or 404-like, fill from RSS index
      const rss = (rssIndex as any)[decodeURIComponent(slug)] as { en?: string; pt?: string; ru?: string } | undefined;
      if (rss) {
        if (!titles.en || /^404/i.test(titles.en)) titles.en = rss.en || titles.en;
        if (!titles.pt || /^404/i.test(titles.pt)) titles.pt = rss.pt || titles.pt || titles.en;
        if (!titles.ru || /^404/i.test(titles.ru)) titles.ru = rss.ru || titles.ru || titles.en;
      }

      // Fallbacks from EN
      titles.pt ||= titles.en;
      titles.ru ||= titles.en;
      contents.pt ||= contents.en;
      contents.ru ||= contents.en;
      excerpts.pt ||= excerpts.en;
      excerpts.ru ||= excerpts.en;

      if (!(contents.en || contents.pt || contents.ru)) {
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

      const existing = await storage.getArticleBySlug(finalSlug);
      if (existing) {
        console.log(` - Updating existing article id=${existing.id}`);
        await storage.updateArticle(existing.id, insert);
      } else {
        console.log(' - Creating new article');
        await storage.createArticle(insert);
      }
    }
    console.log('\nURL-based import completed.');
  } finally {
    // eslint-disable-next-line no-empty
    try { await browser.close(); } catch {}
  }
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
