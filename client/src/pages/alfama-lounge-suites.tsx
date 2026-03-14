import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useTours } from "@/hooks/use-tours";
import { getLocalizedText } from "@/lib/tour-utils";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type RecommendationSeed = {
  id: string;
  titleKey: string;
  items: Array<{
    name: string;
    address: string;
    noteKey: string;
  }>;
};

const recommendationSeeds: RecommendationSeed[] = [
  {
    id: "cafes",
    titleKey: "alfamaLoungeSuites.categories.cafes",
    items: [
      {
        name: "Pois Cafe",
        address: "Rua de Sao Joao da Praca 93-95, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.cafes.poisCafe",
      },
      {
        name: "Copenhagen Coffee Lab",
        address: "Escolas Gerais 34, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.cafes.copenhagenCoffeeLab",
      },
      {
        name: "Quase Cafe",
        address: "Rua do Salvador 32, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.cafes.quaseCafe",
      },
      {
        name: "Audrey's",
        address: "Rua de Santiago 14, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.cafes.audreys",
      },
      {
        name: "Dear Breakfast Alfama",
        address: "Largo de Santo Antonio da Se 16, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.cafes.dearBreakfast",
      },
    ],
  },
  {
    id: "restaurants",
    titleKey: "alfamaLoungeSuites.categories.restaurants",
    items: [
      {
        name: "Bela Vinhos e Petiscos",
        address: "Rua dos Remedios 190, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.restaurants.bela",
      },
      {
        name: "Ti Natercia",
        address: "Rua das Escolas Gerais, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.restaurants.caisNaPreguica",
      },
      {
        name: "Restaurante A Tuna",
        address: "Rua das Escolas Gerais, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.restaurants.travessaDoFado",
      },
      {
        name: "Casa da Tia Helena",
        address: "Rua de Sao Miguel, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.restaurants.baiuca",
      },
      {
        name: "Augusto Lisboa",
        address: "Largo do Contador-Mor, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.restaurants.pateo13",
      },
    ],
  },
  {
    id: "bars",
    titleKey: "alfamaLoungeSuites.categories.bars",
    items: [
      {
        name: "Memmo Alfama Wine Bar",
        address: "Travessa das Merceeiras 27, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.bars.memmo",
      },
      {
        name: "Crafty Corner",
        address: "Rua de Sao Joao da Praca 93-95, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.bars.craftyCorner",
      },
      {
        name: "Ulysses Speakeasy",
        address: "Rua da Regueira 16A, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.bars.ulysses",
      },
      {
        name: "Tejo Bar",
        address: "Beco do Vigario 1A, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.bars.tejoBar",
      },
      {
        name: "Porto Alfama",
        address: "Rua de Sao Pedro 26, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.bars.portoAlfama",
      },
    ],
  },
  {
    id: "fado",
    titleKey: "alfamaLoungeSuites.categories.fado",
    items: [
      {
        name: "Mesa de Frades",
        address: "Rua dos Remedios 139A, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.fado.mesaDeFrades",
      },
      {
        name: "Clube de Fado",
        address: "Rua de Sao Joao da Praca 86-94, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.fado.clubeDeFado",
      },
      {
        name: "Parreirinha de Alfama",
        address: "Beco do Espirito Santo 1, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.fado.parreirinha",
      },
      {
        name: "A Baiuca",
        address: "Rua de Sao Miguel 20, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.fado.baiuca",
      },
      {
        name: "Tasca da Bela",
        address: "Rua dos Remedios 190, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.fado.tascaDaBela",
      },
    ],
  },
  {
    id: "attractions",
    titleKey: "alfamaLoungeSuites.categories.attractions",
    items: [
      {
        name: "Lisbon Cathedral",
        address: "Largo da Se, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.attractions.cathedral",
      },
      {
        name: "Castelo de Sao Jorge",
        address: "Rua de Santa Cruz do Castelo, Lisbon",
        noteKey: "alfamaLoungeSuites.recommendations.attractions.castelo",
      },
      {
        name: "Museu do Fado",
        address: "Largo do Chafariz de Dentro 1, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.attractions.museuDoFado",
      },
      {
        name: "National Pantheon",
        address: "Campo de Santa Clara, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.attractions.pantheon",
      },
      {
        name: "Sao Vicente de Fora",
        address: "Largo de Sao Vicente, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.attractions.saoVicente",
      },
    ],
  },
  {
    id: "viewpoints",
    titleKey: "alfamaLoungeSuites.categories.viewpoints",
    items: [
      {
        name: "Miradouro de Santa Luzia",
        address: "Largo de Santa Luzia, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.viewpoints.santaLuzia",
      },
      {
        name: "Miradouro das Portas do Sol",
        address: "Largo Portas do Sol, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.viewpoints.portasDoSol",
      },
      {
        name: "Miradouro do Recolhimento",
        address: "Near Rua do Recolhimento, Castelo",
        noteKey: "alfamaLoungeSuites.recommendations.viewpoints.recolhimento",
      },
      {
        name: "Miradouro de Santo Estevao",
        address: "Largo de Santo Estevao, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.viewpoints.santoEstevao",
      },
      {
        name: "Miradouro de Sao Vicente",
        address: "Near Sao Vicente de Fora, Alfama",
        noteKey: "alfamaLoungeSuites.recommendations.viewpoints.saoVicente",
      },
    ],
  },
  {
    id: "supermarkets",
    titleKey: "alfamaLoungeSuites.categories.supermarkets",
    items: [
      {
        name: "Pingo Doce Santa Apolonia",
        address: "Rua de Santa Apolonia 1100-486, Lisbon",
        noteKey: "alfamaLoungeSuites.recommendations.supermarkets.pingoSantaApolonia",
      },
      {
        name: "Meu Super Santa Apolonia",
        address: "Rua Diogo do Couto 27B, 1100-300 Lisbon",
        noteKey: "alfamaLoungeSuites.recommendations.supermarkets.pingoChaoDoLoureiro",
      },
      {
        name: "Pingo Doce Chao do Loureiro",
        address: "Largo Chao do Loureiro, 1100-145 Lisbon",
        noteKey: "alfamaLoungeSuites.recommendations.supermarkets.meuSuperSantaApolonia",
      },
      {
        name: "Meu Super Fanqueiros",
        address: "Rua dos Fanqueiros 140, 1100-500 Lisbon",
        noteKey: "alfamaLoungeSuites.recommendations.supermarkets.meuSuperFanqueiros",
      },
      {
        name: "Amanhecer",
        address: "Rua dos Correeiros 8, 1100-166 Lisbon",
        noteKey: "alfamaLoungeSuites.recommendations.supermarkets.minimercadoDoAli",
      },
    ],
  },
  {
    id: "guided-tours",
    titleKey: "alfamaLoungeSuites.categories.guidedTours",
    items: [
      {
        name: "Discover Lisbon Alfama Walking Tour",
        address: "Starts around Portas do Sol, a short walk from the hotel",
        noteKey: "alfamaLoungeSuites.recommendations.guidedTours.discoverLisbon",
      },
      {
        name: "GuruWalk Secrets of Alfama",
        address: "Usually starts in central Alfama or nearby viewpoints",
        noteKey: "alfamaLoungeSuites.recommendations.guidedTours.guruWalk",
      },
      {
        name: "Boost Portugal Old Town Tuk Tuk Tour",
        address: "Pickup possible around Alfama and Santa Apolonia",
        noteKey: "alfamaLoungeSuites.recommendations.guidedTours.boostPortugal",
      },
      {
        name: "Just Tour It Alfama Tuk Tuk Tour",
        address: "Starts in the Alfama hill area near the hotel",
        noteKey: "alfamaLoungeSuites.recommendations.guidedTours.justTourIt",
      },
      {
        name: "Diva Tuk Tours Alfama Tour",
        address: "Central Lisbon pickup with easy access from the hotel",
        noteKey: "alfamaLoungeSuites.recommendations.guidedTours.divaTukTours",
      },
    ],
  },
];

const hotelSlides = [
  {
    src: "/alfama-lounge-suites/room-1.jpg",
    altKey: "alfamaLoungeSuites.slides.room1Alt",
    eyebrowKey: "alfamaLoungeSuites.slides.room1Eyebrow",
    titleKey: "alfamaLoungeSuites.slides.room1Title",
  },
  {
    src: "/alfama-lounge-suites/room-2.jpg",
    altKey: "alfamaLoungeSuites.slides.room2Alt",
    eyebrowKey: "alfamaLoungeSuites.slides.room2Eyebrow",
    titleKey: "alfamaLoungeSuites.slides.room2Title",
  },
  {
    src: "/alfama-lounge-suites/room-3.jpg",
    altKey: "alfamaLoungeSuites.slides.room3Alt",
    eyebrowKey: "alfamaLoungeSuites.slides.room3Eyebrow",
    titleKey: "alfamaLoungeSuites.slides.room3Title",
  },
];

export default function AlfamaLoungeSuitesPage() {
  const { t, i18n } = useTranslation();
  const { tours } = useTours();
  const [openCategory, setOpenCategory] = useState<string>("bars");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [selectedSlide, setSelectedSlide] = useState(0);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const recommendationCategories = recommendationSeeds.map((category) => ({
    id: category.id,
    title: t(category.titleKey),
    items: category.items.map((item) => ({
      ...item,
      note: t(item.noteKey),
    })),
  }));

  const firstDayTips = [
    t("alfamaLoungeSuites.firstDayTips.tip1"),
    t("alfamaLoungeSuites.firstDayTips.tip2"),
    t("alfamaLoungeSuites.firstDayTips.tip3"),
    t("alfamaLoungeSuites.firstDayTips.tip4"),
  ];

  const liveTours = tours.slice(0, 5).map((tour) => ({
    id: String(tour.id),
    name: getLocalizedText(tour.name, i18n.language),
    meta: `${tour.duration}${t("alfamaLoungeSuites.tourMetaSeparator")}${t("alfamaLoungeSuites.tourFromLisbonLovesMe")}`,
    note:
      getLocalizedText(tour.shortDescription || undefined, i18n.language) ||
      getLocalizedText(tour.description || undefined, i18n.language),
    href: `/tour/${tour.id}`,
  }));

  const categoriesToRender = recommendationCategories.map((category) =>
    category.id === "guided-tours"
      ? {
          ...category,
          items: liveTours.length > 0 ? liveTours : category.items,
        }
      : category
  );

  const getGoogleMapsHref = (address: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const onSelect = () => {
      setSelectedSlide(carouselApi.selectedScrollSnap());
    };

    onSelect();
    carouselApi.on("select", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!openCategory) {
      return;
    }

    const element = categoryRefs.current[openCategory];
    if (!element) {
      return;
    }

    const navbarHeight = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--navbar-height"),
      10
    ) || 56;

    const top = element.getBoundingClientRect().top + window.scrollY - navbarHeight - 12;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
  }, [openCategory]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const interval = window.setInterval(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, 4500);

    return () => window.clearInterval(interval);
  }, [carouselApi]);

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8f1e6_0%,#fcfaf6_45%,#f4ede2_100%)]">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -left-16 top-16 h-48 w-48 rounded-full bg-amber-200/60 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-orange-200/50 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-rose-100/70 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-stone-200/80 bg-white/80 p-4 shadow-[0_30px_80px_rgba(120,77,36,0.12)] backdrop-blur md:p-6">
            <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="relative">
              <CarouselContent className="ml-0">
                {hotelSlides.map((slide) => (
                  <CarouselItem key={slide.src} className="pl-0">
                    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/70">
                      <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.55)_100%)]" />
                      <img
                        src={slide.src}
                        alt={t(slide.altKey)}
                        className="h-[300px] w-full object-cover sm:h-[420px]"
                      />
                      <div className="absolute inset-x-0 bottom-0 z-20 px-6 py-6 text-white sm:px-8 sm:py-8">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/80">
                          {t(slide.eyebrowKey)}
                        </p>
                        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
                          {t("alfamaLoungeSuites.hotelName")}
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-7 text-white/90 sm:text-base">
                          {t(slide.titleKey)}
                        </p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 top-1/2 h-10 w-10 -translate-y-1/2 border-white/30 bg-white/85 text-stone-900 hover:bg-white" />
              <CarouselNext className="right-4 top-1/2 h-10 w-10 -translate-y-1/2 border-white/30 bg-white/85 text-stone-900 hover:bg-white" />
            </Carousel>

            <div className="mt-5 flex items-center justify-between gap-4 px-2 sm:px-1">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
                  {t("alfamaLoungeSuites.locationLabel")}
                </p>
                <p className="mt-2 max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
                  {t("alfamaLoungeSuites.heroDescription")}
                </p>
              </div>
              <div className="flex gap-2">
                {hotelSlides.map((slide, index) => (
                  <button
                    key={slide.src}
                    type="button"
                    onClick={() => carouselApi?.scrollTo(index)}
                    className={cn(
                      "h-2.5 rounded-full transition-all",
                      selectedSlide === index ? "w-9 bg-stone-900" : "w-2.5 bg-stone-300"
                    )}
                    aria-label={t("alfamaLoungeSuites.slideButtonLabel", { index: index + 1 })}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">
              {t("alfamaLoungeSuites.welcomeLabel")}
            </p>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-stone-900 sm:text-5xl">
              {t("alfamaLoungeSuites.welcomeTitle")}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
              {t("alfamaLoungeSuites.welcomeBody")}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">
              {t("alfamaLoungeSuites.specialLabel")}
            </p>
            <div className="mt-5 space-y-5 text-base leading-8 text-stone-700 sm:text-lg">
              <p>{t("alfamaLoungeSuites.specialBody1")}</p>
              <p>{t("alfamaLoungeSuites.specialBody2")}</p>
              <p>{t("alfamaLoungeSuites.specialBody3")}</p>
            </div>
          </article>

          <aside className="rounded-[2rem] border border-stone-200 bg-stone-900 p-7 text-stone-100 shadow-sm sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">
              {t("alfamaLoungeSuites.firstDayLabel")}
            </p>
            <div className="mt-6 space-y-5">
              {firstDayTips.map((tip) => (
                <div key={tip} className="flex gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
                  <p className="text-sm leading-7 text-stone-200">{tip}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">
            {t("alfamaLoungeSuites.recommendationsLabel")}
          </p>
          <h3 className="mt-4 text-3xl font-bold text-stone-900 sm:text-4xl">
            {t("alfamaLoungeSuites.recommendationsTitle")}
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-stone-600">
            {t("alfamaLoungeSuites.recommendationsBody")}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-stone-500">
            {t("alfamaLoungeSuites.proximityNote")}
          </p>
        </div>

        <div className="space-y-3">
          {categoriesToRender.map((category) => {
            const isOpen = openCategory === category.id;

            return (
              <div
                key={category.id}
                ref={(element) => {
                  categoryRefs.current[category.id] = element;
                }}
                className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenCategory(isOpen ? "" : category.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                  aria-expanded={isOpen}
                >
                  <span className="text-lg font-bold text-stone-900">{category.title}</span>
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-transform",
                      isOpen && "rotate-180 bg-stone-900 text-white"
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-stone-100 px-5 pb-6 pt-2 sm:px-6">
                    <div className="space-y-4">
                      {category.items.map((item) => (
                        <div
                          key={item.name}
                          className="rounded-[1.25rem] bg-stone-50 px-4 py-4 sm:px-5"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                            <h4 className="text-base font-semibold text-stone-900">{item.name}</h4>
                            {"address" in item ? (
                              <a
                                href={getGoogleMapsHref(item.address)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-primary hover:underline"
                              >
                                {item.address}
                              </a>
                            ) : (
                              <p className="text-sm font-medium text-stone-500">{item.meta}</p>
                            )}
                          </div>
                          <p className="mt-2 text-sm leading-7 text-stone-600">{item.note}</p>
                          {"href" in item ? (
                            <Link
                              href={item.href}
                              className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                            >
                              {t("alfamaLoungeSuites.viewTour")}
                            </Link>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
