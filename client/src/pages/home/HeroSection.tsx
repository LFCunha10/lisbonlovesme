import { Button } from "@/components/ui/button";
import { useBookingModal } from "@/hooks/use-bookings";

export default function HeroSection() {
  const { openBookingModal } = useBookingModal();

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
            Discover the Soul of Lisbon with Local Guides
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Experience authentic Portuguese culture, breathtaking architecture, and hidden gems with our expert-guided tours.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="font-semibold"
            >
              <a href="#tours">Explore Tours</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white hover:bg-white/90 text-primary font-semibold border-none"
              onClick={() => openBookingModal()}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
