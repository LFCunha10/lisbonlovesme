import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AboutUs() {
  const { t } = useTranslation();
  
  return (
    <section id="about" className="py-16 bg-neutral-light">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t('aboutUs.title')}
            </h2>
            <p className="text-lg mb-6">
              {t('aboutUs.description')}
            </p>
            
            <div className="mb-8">
              <Feature 
                title={t('aboutUs.feature1Title')}
                description={t('aboutUs.feature1Description')}
              />
              
              <Feature 
                title={t('aboutUs.feature2Title')}
                description={t('aboutUs.feature2Description')}
              />
              
              <Feature 
                title={t('aboutUs.feature3Title')}
                description={t('aboutUs.feature3Description')}
              />
            </div>
            
            <a href="#our-guides" className="inline-flex items-center text-primary font-semibold hover:underline">
              {t('aboutUs.meetOurTeam')} <ArrowRightIcon className="ml-1" />
            </a>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <img 
              src="https://media.cntraveler.com/photos/58f98475aae67d6f485215e3/master/w_2240%2Cc_limit/lisbon-tram-GettyImages-564582647.jpg" 
              alt="Tour guide explaining Lisbon history" 
              className="rounded-lg shadow-md w-full h-auto object-cover mb-4"
            />
            
            <img 
              src="https://www.travelandleisure.com/thmb/CHmlVbTeMhxCKPnUbmrvbO0nqK0=/750x0/filters:no_upscale():max_bytes(150000):strip_icc()/lisbon-portugal-LISBONTG0521-c933a0fb669647619fa580f6c602c4c8.jpg" 
              alt="Tour guide with map of Lisbon" 
              className="rounded-lg shadow-md w-full h-auto object-cover"
            />
            
            <img 
              src="https://media.cntraveler.com/photos/58f9834f57db6e4495ce9763/master/w_2240%2Cc_limit/pasteis-de-nata-lisbon-GettyImages-481208082.jpg" 
              alt="Tour group at São Jorge Castle" 
              className="rounded-lg shadow-md w-full h-auto object-cover"
            />
            
            <img 
              src="https://media.cntraveler.com/photos/58f983d557db6e4495ce9767/master/w_2240%2Cc_limit/alfama-lisbon-GettyImages-691043889.jpg" 
              alt="Guide showcasing Portuguese tiles" 
              className="rounded-lg shadow-md w-full h-auto object-cover mt-4"
            />

             <img 
              src="https://media.cntraveler.com/photos/58f984542867946a9cbe1f11/master/w_2240%2Cc_limit/praca-do-comercio-lisbon-GettyImages-648812458.jpg" 
              alt="Guide showcasing Portuguese tiles" 
              className="rounded-lg shadow-md w-full h-auto object-cover mt-4"
            />

             <img 
              src="https://media.cntraveler.com/photos/55d4fa19c47ae13868aea611/master/w_2240%2Cc_limit/azulejos-lisbon-cr-francisco-leong-afp-getty-tout.jpg" 
              alt="Guide showcasing Portuguese tiles" 
              className="rounded-lg shadow-md w-full h-auto object-cover mt-4"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface FeatureProps {
  title: string;
  description: string;
}

function Feature({ title, description }: FeatureProps) {
  return (
    <div className="flex items-center mb-4">
      <div className="h-8 w-8 text-success mr-3 flex items-center justify-center">
        <Check className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M16.172 11L10.808 5.63605L12.222 4.22205L20 12L12.222 19.778L10.808 18.364L16.172 13H4V11H16.172Z" 
        fill="currentColor"
      />
    </svg>
  );
}
