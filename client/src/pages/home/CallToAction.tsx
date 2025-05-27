import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function CallToAction() {
  const { t } = useTranslation();
  return (
    <section id="book-now" className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{t("callToAction.title")}</h2>
          <p className="text-lg mb-8">
            {t("callToAction.subtitle")}
          </p>
          <Button 
            size="lg"
            variant="outline" 
            className="bg-white text-primary hover:bg-white/90 hover:text-primary border-white text-lg font-semibold px-8"
          >
            <Link href="/tours">
               {t("callToAction.bookNow")}
            </Link>
           
          </Button>
        </div>
      </div>
    </section>
  );
}
