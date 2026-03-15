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
    <section className="pt-24 pb-12 md:pt-24 md:pb-14 lg:pt-28 lg:pb-16 relative">
      {/* Background image */}
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
        }}
      />
      {/* Readability overlay */}
      <div
        className="absolute inset-0 h-full w-full bg-black/50"
        style={{ zIndex: -1 }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl text-white">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-4 drop-shadow-lg">
            {t('home.welcome')}
          </h1>
          <p className="text-base sm:text-lg md:text-lg lg:text-xl mb-6 sm:mb-8 drop-shadow">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="font-semibold"
            >
              <a href="#tours">{t('home.explore')}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
