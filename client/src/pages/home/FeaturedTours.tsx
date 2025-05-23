import { Button } from "@/components/ui/button";
import TourCard from "@/components/tours/TourCard";
import { ArrowRight } from "lucide-react";
import { useTours } from "@/hooks/use-tours";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function FeaturedTours() {
  const { tours, isLoading, error } = useTours();

  return (
    <section id="tours" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Our Featured Tours</h2>
          <p className="text-lg text-neutral-dark/80 max-w-2xl mx-auto">
            Discover Lisbon's rich history, vibrant culture, and stunning landmarks with our carefully curated tours.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading && (
            <>
              <TourCardSkeleton />
              <TourCardSkeleton />
              <TourCardSkeleton />
            </>
          )}
          
          {error && (
            <div className="col-span-3 text-center text-error">
              Failed to load tours: {error.message}
            </div>
          )}
          
          {!isLoading && !error && tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button
            variant="outline"
            className="inline-flex items-center justify-center border-2 border-primary hover:bg-primary hover:text-white"
            asChild
          >
            <Link href="/tours">
              View All Tours <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function TourCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md">
      <Skeleton className="w-full h-56" />
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-5 w-1/4 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}
