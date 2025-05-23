import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useTestimonials } from "@/hooks/use-tours";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function Reviews() {
  const { testimonials, isLoading, error } = useTestimonials();
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slidesToShow, setSlidesToShow] = useState(3);

  // Update slidesToShow based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSlidesToShow(1);
      } else if (window.innerWidth < 1024) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const goToSlide = (index: number) => {
    if (!testimonials.length) return;
    
    const maxIndex = Math.max(0, testimonials.length - slidesToShow);
    const newIndex = Math.min(Math.max(0, index), maxIndex);
    setCurrentSlide(newIndex);
    
    if (containerRef.current) {
      const slideWidth = containerRef.current.clientWidth / slidesToShow;
      containerRef.current.style.transform = `translateX(-${newIndex * slideWidth}px)`;
    }
  };

  return (
    <section id="reviews" className="py-16 bg-neutral-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{t('customerReviews.guestsTitle')}</h2>
          <p className="text-lg text-neutral-dark/80 max-w-2xl mx-auto">
            {t('customerReviews.subtitle')}
          </p>
        </div>
        
        <div className="reviews-slider relative">
          <div className="overflow-hidden">
            <div 
              ref={containerRef}
              className="flex transition-all duration-300"
              style={{ transform: `translateX(-${currentSlide * (100 / slidesToShow)}%)` }}
            >
              {isLoading ? (
                <>
                  <ReviewSkeleton />
                  <ReviewSkeleton />
                  <ReviewSkeleton />
                </>
              ) : error ? (
                <div className="w-full p-4 text-center text-error">
                  Failed to load reviews: {error.message}
                </div>
              ) : (
                testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 p-4"
                    style={{ minWidth: `${100 / slidesToShow}%` }}
                  >
                    <div className="bg-white p-6 rounded-lg shadow-md h-full">
                      <div className="flex items-center text-yellow-400 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="fill-current"
                            size={18}
                            data-filled={i < testimonial.rating}
                          />
                        ))}
                      </div>
                      
                      <p className="text-neutral-dark/80 mb-6 italic">
                        "{testimonial.text}"
                      </p>
                      
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-neutral-light rounded-full mr-4 flex items-center justify-center text-primary">
                          {testimonial.customerName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold">{testimonial.customerName}</div>
                          <div className="text-sm text-neutral-dark/70">
                            from {testimonial.customerCountry}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <button 
            className="absolute top-1/2 -left-4 md:left-2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-neutral-dark hover:text-primary transition-all"
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
            aria-label="Previous review"
          >
            <ChevronLeft className="text-xl" />
          </button>
          
          <button 
            className="absolute top-1/2 -right-4 md:right-2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-neutral-dark hover:text-primary transition-all"
            onClick={() => goToSlide(currentSlide + 1)}
            disabled={currentSlide >= testimonials.length - slidesToShow}
            aria-label="Next review"
          >
            <ChevronRight className="text-xl" />
          </button>
        </div>
        
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.length > 0 && 
            [...Array(Math.ceil(testimonials.length / slidesToShow))].map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full ${
                  Math.floor(currentSlide / slidesToShow) === index
                    ? "bg-primary"
                    : "bg-neutral-dark/30"
                }`}
                onClick={() => goToSlide(index * slidesToShow)}
                aria-label={`Go to review group ${index + 1}`}
              />
            ))}
        </div>
      </div>
    </section>
  );
}

function ReviewSkeleton() {
  return (
    <div className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md h-full">
        <div className="flex items-center mb-4">
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <div className="flex items-center">
          <Skeleton className="w-12 h-12 rounded-full mr-4" />
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}