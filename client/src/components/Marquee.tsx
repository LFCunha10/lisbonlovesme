import { useTranslation } from "react-i18next";

const ITEMS_EN = [
  "Lisbon Tours",
  "Local Guides",
  "Alfama",
  "Belém",
  "Fado Nights",
  "Tagus River",
  "Pastéis de Nata",
  "Hidden Gems",
];

const ITEMS_PT = [
  "Tours em Lisboa",
  "Guias Locais",
  "Alfama",
  "Belém",
  "Noites de Fado",
  "Rio Tejo",
  "Pastéis de Nata",
  "Tesouros Escondidos",
];

const ITEMS_RU = [
  "Туры по Лиссабону",
  "Местные гиды",
  "Алфама",
  "Белен",
  "Вечера фаду",
  "Река Тежу",
  "Паштел-де-ната",
  "Скрытые жемчужины",
];

/**
 * Site-wide marquee strip — animated text band with accent stars.
 * Styled inline so it doesn't depend on Tailwind config.
 */
export default function Marquee() {
  const { i18n } = useTranslation();
  const code = (i18n.language || "en").slice(0, 2).toLowerCase();
  const items =
    code === "pt" ? ITEMS_PT : code === "ru" ? ITEMS_RU : ITEMS_EN;
  // Duplicate for the seamless -50% translateX loop.
  const loop = [...items, ...items];

  return (
    <>
      <style>{`
        @keyframes site-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          overflow: "hidden",
          padding: "0.9rem 0",
          backgroundColor: "#181512",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "3rem",
            width: "max-content",
            animation: "site-marquee 28s linear infinite",
          }}
        >
          {loop.map((label, i) => (
            <span
              key={`${label}-${i}`}
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(250, 248, 245, 0.4)",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "3rem",
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              {label}
              <span style={{ color: "#E8522A", fontSize: "0.55rem" }}>✦</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
