import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTours, useTestimonials } from "@/hooks/use-tours";
import type { Tour, Testimonial } from "@shared/schema";
import Marquee from "./Marquee";
import "./theme.css";

const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1558370781-d6196949e317?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1200";

type Lang = "en" | "pt" | "ru";

function pickLang(value: { en: string; pt: string; ru: string } | undefined, lang: Lang): string {
  if (!value) return "";
  return value[lang] || value.en || "";
}

function useLang(): Lang {
  const { i18n } = useTranslation();
  const code = (i18n.language || "en").slice(0, 2).toLowerCase();
  if (code === "pt" || code === "ru") return code;
  return "en";
}

/* ───────── Nav ───────── */
function WhatsNextNav() {
  const { i18n } = useTranslation();
  const lang = useLang();
  return (
    <nav className="wn-nav">
      <Link href="/whats-next" className="wn-logo">
        Lisbonlovesme<span>.</span>
      </Link>
      <ul className="wn-nav-links">
        <li><a href="#tours">{lang === "pt" ? "Tours" : "Tours"}</a></li>
        <li><a href="#about">{lang === "pt" ? "Sobre" : "About"}</a></li>
        <li><a href="#reviews">{lang === "pt" ? "Avaliações" : "Reviews"}</a></li>
        <li><a href="#contact">{lang === "pt" ? "Contacto" : "Contact"}</a></li>
      </ul>
      <div className="wn-nav-right">
        <div className="wn-lang-toggle">
          <button
            className={lang === "en" ? "active" : ""}
            onClick={() => i18n.changeLanguage("en")}
          >EN</button>
          <button
            className={lang === "pt" ? "active" : ""}
            onClick={() => i18n.changeLanguage("pt")}
          >PT</button>
        </div>
        <Link href="/" className="wn-btn-accent">
          {lang === "pt" ? "Voltar ao site" : "Back to live site"}
        </Link>
      </div>
    </nav>
  );
}

/* ───────── Hero ───────── */
function WhatsNextHero() {
  const lang = useLang();
  const { data: adminSettings } = useQuery<{ heroBannerImageUrl?: string }>({
    queryKey: ["/api/settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  });
  const bg = adminSettings?.heroBannerImageUrl || DEFAULT_HERO;

  return (
    <section className="wn-hero">
      <div className="wn-hero-bg" style={{ backgroundImage: `url('${bg}')` }} />
      <div className="wn-hero-inner">
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="wn-tag">
            {lang === "pt" ? "Tours autênticos · Lisboa" : "Authentic tours · Lisbon"}
          </p>
          <h1 className="wn-hero-h1">
            {lang === "pt" ? (
              <>Descubra Lisboa<br /><em>como um local</em></>
            ) : (
              <>Discover Lisbon<br /><em>like a local</em></>
            )}
          </h1>
        </div>
        <div className="wn-hero-right" style={{ position: "relative", zIndex: 1 }}>
          <p className="wn-hero-desc">
            {lang === "pt"
              ? "Tours guiados por moradores apaixonados, com histórias, sabores e cantos escondidos que só Lisboa pode oferecer."
              : "Walking tours led by locals who love this city — stories, flavours and hidden corners only Lisbon can offer."}
          </p>
          <div className="wn-hero-actions">
            <a href="#tours" className="wn-btn">
              {lang === "pt" ? "Ver tours" : "View tours"}
            </a>
            <a href="#contact" className="wn-btn-outline">
              {lang === "pt" ? "Fale connosco" : "Get in touch"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── Stats ───────── */
function WhatsNextStats() {
  const lang = useLang();
  const stats: Array<[string, string]> = lang === "pt"
    ? [["2500+", "Visitantes guiados"], ["10+", "Anos em Lisboa"], ["4.9★", "Avaliação média"], ["12", "Bairros explorados"]]
    : [["2500+", "Travellers guided"], ["10+", "Years in Lisbon"], ["4.9★", "Average rating"], ["12", "Neighbourhoods covered"]];
  return (
    <div className="wn-stats">
      {stats.map(([n, l]) => (
        <div className="wn-stat" key={l}>
          <div className="wn-stat-n">{n}</div>
          <div className="wn-stat-l">{l}</div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Services strip ───────── */
function WhatsNextServices() {
  const lang = useLang();
  const items = lang === "pt"
    ? [
        ["01", "Tours a pé", "Caminhadas guiadas pelos bairros mais autênticos da cidade."],
        ["02", "Gastronomia", "Pastéis, vinhos e petiscos com paragens em locais favoritos dos lisboetas."],
        ["03", "Cultura & Fado", "Música, história e tradições — vividas, não apenas contadas."],
        ["04", "Tours privados", "Experiências personalizadas para famílias, casais e grupos pequenos."],
      ]
    : [
        ["01", "Walking tours", "Guided walks through Lisbon's most authentic neighbourhoods."],
        ["02", "Food & wine", "Pastéis, wines and tascas at the spots locals actually love."],
        ["03", "Culture & Fado", "Music, history and traditions — lived, not just told."],
        ["04", "Private tours", "Tailored experiences for families, couples and small groups."],
      ];

  return (
    <div className="wn-services">
      {items.map(([num, name, desc]) => (
        <div className="wn-service" key={num}>
          <div className="wn-service-num">{num}</div>
          <div className="wn-service-name">{name}</div>
          <div className="wn-service-desc">{desc}</div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Featured tours ───────── */
function WhatsNextFeatured() {
  const lang = useLang();
  const { tours, isLoading } = useTours();
  const visible = (tours as Tour[]).slice(0, 3);

  return (
    <section id="tours" className="wn-featured">
      <div className="wn-section-head">
        <h2 className="wn-section-title">
          {lang === "pt" ? <>Tours <em>selecionados</em></> : <>Selected <em>tours</em></>}
        </h2>
        <Link href="/tours" className="wn-see-all">
          {lang === "pt" ? "Ver todos →" : "View all →"}
        </Link>
      </div>
      <div className="wn-work-grid">
        {isLoading && visible.length === 0 && (
          <>
            <div className="wn-work-card"><div className="wn-work-img" /><div className="wn-work-info"><div className="wn-work-tag">…</div><div className="wn-work-title">Loading</div></div></div>
            <div className="wn-work-card"><div className="wn-work-img" /><div className="wn-work-info"><div className="wn-work-tag">…</div><div className="wn-work-title">Loading</div></div></div>
            <div className="wn-work-card"><div className="wn-work-img" /><div className="wn-work-info"><div className="wn-work-tag">…</div><div className="wn-work-title">Loading</div></div></div>
          </>
        )}
        {visible.map((tour) => (
          <Link
            key={tour.id}
            href={`/tour/${tour.id}`}
            className="wn-work-card"
          >
            <div
              className="wn-work-img"
              style={tour.imageUrl ? { backgroundImage: `url('${tour.imageUrl}')` } : undefined}
            />
            <div className="wn-work-info">
              <div className="wn-work-tag">
                {tour.duration} {tour.duration === 1 ? (lang === "pt" ? "hora" : "hour") : (lang === "pt" ? "horas" : "hours")}
              </div>
              <div className="wn-work-title">{pickLang(tour.name as any, lang)}</div>
              <div className="wn-work-meta">€{tour.price / 100} · {pickLang(tour.shortDescription as any, lang).slice(0, 60)}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ───────── Testimonials ───────── */
function WhatsNextReviews() {
  const lang = useLang();
  const { testimonials } = useTestimonials();
  const visible = (testimonials as Testimonial[]).slice(0, 3);

  return (
    <section id="reviews" className="wn-testimonials">
      <h2 className="wn-section-title">
        {lang === "pt" ? <><em>O que dizem</em><br />os nossos viajantes</> : <><em>What travellers</em><br />say about us</>}
      </h2>
      <div className="wn-testi-grid">
        {visible.map((t, i) => (
          <div className="wn-testi-card" key={i}>
            <div className="wn-testi-stars">
              {"★".repeat(Math.max(0, Math.min(5, t.rating || 5)))}
            </div>
            <p className="wn-testi-quote">"{t.text}"</p>
            <div className="wn-testi-author">
              <div className="wn-testi-avatar">{t.customerName?.charAt(0) || "·"}</div>
              <div>
                <div className="wn-testi-name">{t.customerName}</div>
                <div className="wn-testi-role">{t.customerCountry}</div>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="wn-testi-card">
            <p className="wn-testi-quote">
              {lang === "pt"
                ? "As avaliações dos nossos viajantes vão aparecer aqui."
                : "Traveller reviews will appear here."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────── CTA ───────── */
function WhatsNextCTA() {
  const lang = useLang();
  return (
    <div id="contact" className="wn-cta">
      <h2>
        {lang === "pt" ? <>Pronto para descobrir <em>Lisboa</em>?</> : <>Ready to discover <em>Lisbon</em>?</>}
      </h2>
      <Link href="/tours" className="wn-btn">
        {lang === "pt" ? "Reservar um tour →" : "Book a tour →"}
      </Link>
    </div>
  );
}

/* ───────── Footer ───────── */
function WhatsNextFooter() {
  const lang = useLang();
  return (
    <footer className="wn-footer">
      <div className="wn-footer-top">
        <div>
          <div className="wn-footer-logo">Lisbonlovesme<span>.</span></div>
          <p className="wn-footer-tag">
            {lang === "pt"
              ? "Tours autênticos por quem ama Lisboa."
              : "Authentic tours by people who love Lisbon."}
          </p>
        </div>
        <div>
          <div className="wn-footer-col-title">{lang === "pt" ? "Explorar" : "Explore"}</div>
          <ul className="wn-footer-links">
            <li><Link href="/tours">{lang === "pt" ? "Tours" : "Tours"}</Link></li>
            <li><Link href="/gallery">{lang === "pt" ? "Galeria" : "Gallery"}</Link></li>
            <li><Link href="/3-day-guide-book">{lang === "pt" ? "Guia 3 dias" : "3-day guide"}</Link></li>
          </ul>
        </div>
        <div>
          <div className="wn-footer-col-title">{lang === "pt" ? "Contacto" : "Contact"}</div>
          <ul className="wn-footer-links">
            <li><a href="mailto:hello@lisbonlovesme.com">hello@lisbonlovesme.com</a></li>
          </ul>
        </div>
        <div>
          <div className="wn-footer-col-title">{lang === "pt" ? "Conectar" : "Connect"}</div>
          <ul className="wn-footer-links">
            <li><a href="#">Instagram</a></li>
            <li><a href="#">Facebook</a></li>
          </ul>
        </div>
      </div>
      <div className="wn-footer-bottom">
        <span className="wn-footer-copy">© {new Date().getFullYear()} Lisbonlovesme.</span>
        <span className="wn-footer-copy">
          {lang === "pt" ? "Feito com carinho em Lisboa." : "Made with love in Lisbon."}
        </span>
      </div>
    </footer>
  );
}

/* ───────── Page ───────── */
export default function WhatsNextPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("wn-visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll(".wn-theme [data-wn-reveal]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="wn-theme">
      <div className="wn-staging-banner">
        What&apos;s Next · Staging Preview
      </div>
      <WhatsNextNav />
      <WhatsNextHero />
      <Marquee />
      <WhatsNextServices />
      <WhatsNextFeatured />
      <WhatsNextReviews />
      <WhatsNextCTA />
      <WhatsNextFooter />
    </div>
  );
}
