import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

export default function HeroSection() {
  const { t } = useTranslation();
  const { data: adminSettings } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: () => fetch("/api/settings").then((res) => res.json()),
  });
  const backgroundImage =
    adminSettings?.heroBannerImageUrl ||
    "https://images.unsplash.com/photo-1558370781-d6196949e317?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=800";

  return (
    <section className="pt-24 pb-12 md:pt-24 md:pb-14 lg:pt-28 lg:pb-16 relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />
      {/* Readability overlay */}
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          zIndex: 0,
          background:
            "linear-gradient(180deg, rgba(24,21,18,0.55) 0%, rgba(24,21,18,0.7) 100%)",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl text-white">
          <p
            className="text-xs sm:text-sm uppercase tracking-[0.2em] mb-4 flex items-center gap-3"
            style={{ color: "#E8522A" }}
          >
            <span
              className="inline-block h-px w-7"
              style={{ backgroundColor: "#E8522A" }}
            />
            Lisbon · Authentic Tours
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display leading-[1.05] mb-6 drop-shadow-lg">
            {t('home.welcome')}
          </h1>
          <p className="text-base sm:text-lg md:text-lg lg:text-xl mb-6 sm:mb-8 max-w-xl text-white/85 drop-shadow">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-sm uppercase tracking-[0.12em] text-xs font-medium px-8"
              style={{ backgroundColor: "#E8522A", color: "#FAF8F5" }}
            >
              <a href="#tours">{t('home.explore')}</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-sm uppercase tracking-[0.12em] text-xs font-medium px-8 bg-transparent border-white/60 text-white hover:bg-white hover:text-foreground"
            >
              <a href="#contact">{t('navigation.main.contact')}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
