import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-20 relative">
      {/* Background image */}
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1558370781-d6196949e317?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=800')",
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
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-4 drop-shadow-lg">
            {t('home.welcome')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 drop-shadow">
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
