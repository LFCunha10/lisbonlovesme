import { Button } from "@/components/ui/button";
import { useBookingModal } from "@/hooks/use-bookings";
import { useTranslation } from "react-i18next";

export default function HeroSection() {
  const { openBookingModal } = useBookingModal();
  const { t } = useTranslation();

  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-20 relative">
      <div 
        className="absolute inset-0 h-full w-full bg-gradient-to-r from-primary/80 to-primary/40"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1558370781-d6196949e317?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=800')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-4">
            {t('home.welcome')}
          </h1>
          <p className="text-xl md:text-2xl mb-8">
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
