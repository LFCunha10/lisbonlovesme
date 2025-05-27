import { useEffect } from "react";
import { Link } from "wouter";
import { useTours } from "@/hooks/use-tours";
import TourCard from "@/components/tours/TourCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BookingModal } from "@/components/booking/BookingModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function ToursPage() {
  const { tours, isLoading, error } = useTours();
   const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('tour.backToHome')}
            </Link>
          </Button>
          
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            {t('tour.allTours')}
          </h1>
          <p className="text-lg text-neutral-dark/80">
            {t('tour.allToursDescription')}
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <TourCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-error">
            <p>Failed to load tours: {error.message}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {tours.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-neutral-dark/70">No tours available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <BookingModal />
    </div>
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
