import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CallToAction() {

  return (
    <section id="book-now" className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to Experience Lisbon?</h2>
          <p className="text-lg mb-8">
            Book your tour today and let our expert local guides show you the authentic side of Portugal's beautiful capital city.
          </p>
          <Button 
            size="lg"
            variant="outline" 
            className="bg-white text-primary hover:bg-white/90 hover:text-primary border-white text-lg font-semibold px-8"
          >
            <Link href="/tours">
               Book Your Tour Now
            </Link>
           
          </Button>
        </div>
      </div>
    </section>
  );
}
