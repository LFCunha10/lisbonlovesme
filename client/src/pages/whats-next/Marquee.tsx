import { useTranslation } from "react-i18next";

const FALLBACK_ITEMS_EN = [
  "Lisbon Tours",
  "Local Guides",
  "Alfama",
  "Belém",
  "Fado Nights",
  "Tagus River",
  "Pastéis de Nata",
  "Hidden Gems",
];

const FALLBACK_ITEMS_PT = [
  "Tours em Lisboa",
  "Guias Locais",
  "Alfama",
  "Belém",
  "Noites de Fado",
  "Rio Tejo",
  "Pastéis de Nata",
  "Tesouros Escondidos",
];

export default function Marquee() {
  const { i18n } = useTranslation();
  const items = i18n.language?.startsWith("pt") ? FALLBACK_ITEMS_PT : FALLBACK_ITEMS_EN;
  // Duplicate the list so the -50% translateX loop is seamless.
  const loop = [...items, ...items];

  return (
    <div className="wn-marquee-wrap" aria-hidden="true">
      <div className="wn-marquee-track">
        {loop.map((label, i) => (
          <span className="wn-marquee-item" key={`${label}-${i}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
