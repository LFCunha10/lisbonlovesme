import { Check } from "lucide-react";

export default function AboutUs() {
  return (
    <section id="about" className="py-16 bg-neutral-light">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Local Guides with Passion for Lisbon
            </h2>
            <p className="text-lg mb-6">
              Our team consists of certified local guides who are passionate about sharing Lisbon's rich history, 
              vibrant culture, and hidden gems with visitors from around the world.
            </p>
            
            <div className="mb-8">
              <Feature 
                title="Local Expertise"
                description="Born and raised in Lisbon, our guides know the city inside out."
              />
              
              <Feature 
                title="Language Proficiency"
                description="Our guides are fluent in English, Spanish, French, and Portuguese."
              />
              
              <Feature 
                title="Customized Experiences"
                description="We tailor each tour to match the interests and pace of our clients."
              />
            </div>
            
            <a href="#our-guides" className="inline-flex items-center text-primary font-semibold hover:underline">
              Meet Our Team <ArrowRightIcon className="ml-1" />
            </a>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <img 
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500" 
              alt="Tour guide explaining Lisbon history" 
              className="rounded-lg shadow-md w-full h-auto object-cover mb-4"
            />
            
            <img 
              src="https://images.unsplash.com/photo-1516726817505-f5ed825624d8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300" 
              alt="Tour guide with map of Lisbon" 
              className="rounded-lg shadow-md w-full h-auto object-cover"
            />
            
            <img 
              src="https://images.unsplash.com/photo-1577985043696-8bd54d9f093f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300" 
              alt="Tour group at São Jorge Castle" 
              className="rounded-lg shadow-md w-full h-auto object-cover"
            />
            
            <img 
              src="https://images.unsplash.com/photo-1533551037358-c8f7182cdb79?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500" 
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
