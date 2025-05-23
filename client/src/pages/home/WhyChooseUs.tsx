import { Users, MapPin, Settings, Wallet } from "lucide-react";

export default function WhyChooseUs() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Why Choose Lisboa Tours</h2>
          <p className="text-lg text-neutral-dark/80 max-w-2xl mx-auto">
            We deliver unforgettable experiences through authentic local insights and personalized attention.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Users className="text-2xl" />}
            title="Small Groups"
            description="Maximum of 12 people per tour for a more intimate and personalized experience."
            color="primary"
          />
          
          <FeatureCard
            icon={<MapPin className="text-2xl" />}
            title="Local Expertise"
            description="All our guides are local Lisboetas with deep knowledge of the city's history and culture."
            color="secondary"
          />
          
          <FeatureCard
            icon={<Settings className="text-2xl" />}
            title="Customizable Tours"
            description="We can adjust our tours to match your interests, pace, and accessibility requirements."
            color="accent"
          />
          
          <FeatureCard
            icon={<Wallet className="text-2xl" />}
            title="Value for Money"
            description="Competitive pricing with no hidden fees and free cancellation up to 24 hours in advance."
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
