import { Users, MapPin, Settings, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function WhyChooseUs() {
  const { t } = useTranslation();
  
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{t("whyChooseUs.title")}</h2>
          <p className="text-lg text-neutral-dark/80 max-w-2xl mx-auto">
            {t("whyChooseUs.subtitle")}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Users className="text-2xl" />}
            title={t("whyChooseUs.smallGroups")}
            description={t("whyChooseUs.smallGroupsDesc")}
            color="primary"
          />
          
          <FeatureCard
            icon={<MapPin size = {28} className="text-2xl" />}
            title={t("whyChooseUs.localExpertise")}
            description={t("whyChooseUs.localExpertiseDesc")}
            color="primary"
          />
          
          <FeatureCard
            icon={<Settings className="text-2xl" />}
            title={t("whyChooseUs.customTours")}
            description={t("whyChooseUs.customToursDesc")}
            color="primary"
          />
          
          <FeatureCard
            icon={<Wallet className="text-2xl" />}
            title={t("whyChooseUs.valueForMoney")}
            description={t("whyChooseUs.valueForMoneyDesc")}
            color="primary"
          />
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "primary" | "secondary" | "accent";
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent"
  };

  return (
    <div className="text-center p-6 bg-neutral-light rounded-lg">
      <div className={`mx-auto mb-4 w-16 h-16 flex items-center justify-center ${colorMap[color]} rounded-full`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-neutral-dark/80">{description}</p>
    </div>
  );
}
