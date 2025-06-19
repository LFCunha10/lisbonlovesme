import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useTour, useAvailabilities, useTestimonials } from "@/hooks/use-tours";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Users, Activity, Star, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function TourDetailPage() {
  const { tourId } = useParams();
  const [, setLocation] = useLocation();
  const { tour, isLoading, error } = useTour(parseInt(tourId));
  const { testimonials, isLoading: testimonialsLoading } = useTestimonials(parseInt(tourId));
  const { availabilities } = useAvailabilities(parseInt(tourId));
  
  // Format dates of availabilities
  const [upcomingDates, setUpcomingDates] = useState<string[]>([]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tourId]);
  
  useEffect(() => {
    if (availabilities && availabilities.length > 0) {
      // Get unique dates from availabilities
      const uniqueDates = [...new Set(availabilities.map(a => a.date))];
      // Sort dates
      uniqueDates.sort();
      // Take only the next 5 dates
      setUpcomingDates(uniqueDates.slice(0, 5));
    }
  }, [availabilities]);

  if (isLoading) {
    return <TourDetailSkeleton />;
  }

  if (error || !tour) {
    return (
      <div className="pt-28 pb-16 container mx-auto px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Tour Not Found</h1>
        <p className="mb-8">The requested tour could not be found or has been removed.</p>
        <Button asChild>
          <Link href="/tours">View All Tours</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <Button
          variant="ghost"
          className="mb-4"
          asChild
        >
          <Link href="/tours">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tours
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="relative rounded-lg overflow-hidden mb-6">
              <img 
                src={tour.imageUrl} 
                alt={tour.name} 
                className="w-full h-[400px] object-cover"
              />
              {tour.badge && (
                <div className={`absolute top-4 right-4 bg-${tour.badgeColor}/10 text-${tour.badgeColor} px-3 py-1 rounded-full text-sm font-semibold`}>
                  {tour.badge}
                </div>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">{tour.name}</h1>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="bg-neutral-light px-3 py-1 rounded-full text-sm flex items-center">
                <Clock className="mr-1 h-4 w-4" /> {tour.duration}
              </div>
              <div className="bg-neutral-light px-3 py-1 rounded-full text-sm flex items-center">
                <Users className="mr-1 h-4 w-4" /> Max {tour.maxGroupSize} people
              </div>
              <div className="bg-neutral-light px-3 py-1 rounded-full text-sm flex items-center">
                <Activity className="mr-1 h-4 w-4" /> {tour.difficulty}
              </div>
            </div>

            <Tabs defaultValue="description" className="mb-8">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                <TabsTrigger value="includes">What's Included</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <p className="text-neutral-dark/80">{tour.description}</p>
                <p className="text-neutral-dark/80 mt-4">
                  Join us on this unforgettable tour of Lisbon and discover the heart and soul of Portugal's 
                  vibrant capital. Our knowledgeable local guides will take you off the beaten path to 
                  experience the authentic Lisbon that most tourists never see.
                </p>
              </TabsContent>
              <TabsContent value="itinerary" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Meeting Point</h3>
                    <p className="text-neutral-dark/80">
                      We'll meet at the entrance of {tour.name.includes("Belém") ? "Belém Tower" : 
                        tour.name.includes("Alfama") ? "São Jorge Castle" : "Rossio Square"}, 
                      15 minutes before the tour starts.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">Tour Schedule</h3>
                    <ul className="list-disc list-inside space-y-2 text-neutral-dark/80">
                      <li>Introduction and historical overview</li>
                      <li>Exploration of key landmarks and hidden gems</li>
                      <li>Break for local refreshments</li>
                      <li>Continued exploration with cultural insights</li>
                      <li>Conclusion with recommendations for the rest of your stay</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="includes" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">Included</h3>
                    <ul className="list-disc list-inside space-y-1 text-neutral-dark/80">
                      <li>Professional local guide</li>
                      <li>Small group experience</li>
                      <li>Historical and cultural insights</li>
                      {tour.name.includes("Fado") && <li>Fado performance</li>}
                      {tour.name.includes("Fado") && <li>Traditional dinner</li>}
                      {tour.name.includes("Panoramic") && <li>Transportation between viewpoints</li>}
                      {tour.name.includes("Belém") && <li>Pastéis de Belém tasting</li>}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">Not Included</h3>
                    <ul className="list-disc list-inside space-y-1 text-neutral-dark/80">
                      <li>Transportation to and from your accommodation</li>
                      <li>Additional food and drinks</li>
                      <li>Entrance fees to optional attractions</li>
                      <li>Gratuities (optional)</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mb-8">
              <h2 className="text-xl font-display font-bold mb-4">Guest Reviews</h2>
              
              {testimonialsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : testimonials.length === 0 ? (
                <div className="bg-neutral-light rounded-lg p-6 text-center">
                  <p className="text-neutral-dark/70">No reviews for this tour yet. Be the first to leave a review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className="bg-neutral-light rounded-lg p-6">
                      <div className="flex items-center text-yellow-400 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={i < testimonial.rating ? "fill-current" : ""}
                            size={16}
                          />
                        ))}
                      </div>
                      <p className="text-neutral-dark/80 mb-4 italic">"{testimonial.text}"</p>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-white rounded-full mr-3 flex items-center justify-center text-primary text-sm">
                          {testimonial.customerName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold">{testimonial.customerName}</div>
                          <div className="text-xs text-neutral-dark/70">from {testimonial.customerCountry}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <div className="mb-4">
                <div className="text-2xl font-semibold text-neutral-dark">
                  {formatCurrency(tour.price)}<span className="text-sm font-normal text-neutral-dark/70">/person</span>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Upcoming Dates</h3>
                {upcomingDates.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingDates.map((date, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <span>
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-dark/70">
                    No upcoming dates available. Please contact us for custom scheduling.
                  </p>
                )}
              </div>
              
              <div className="text-sm text-neutral-dark/70">
                <p className="mb-2">• Free cancellation up to 24 hours in advance</p>
                <p className="mb-2">• Small groups for a personalized experience</p>
                <p>• Expert local guides fluent in multiple languages</p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-neutral-light/80">
                <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
                <p className="text-sm text-neutral-dark/80 mb-3">
                  Have questions about this tour? Contact our team for assistance.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation("/#contact")}
                >
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TourDetailSkeleton() {
  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <Skeleton className="h-10 w-40 mb-4" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="w-full h-[400px] rounded-lg mb-6" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            
            <div className="flex flex-wrap gap-3 mb-6">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>

            <div className="mb-4">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>

            <div className="mb-8">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <Skeleton className="h-8 w-32 mb-4" />
              
              <div className="mb-6">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
              </div>
              
              <Skeleton className="h-10 w-full mb-4" />
              
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              
              <Skeleton className="h-px w-full mb-6" />
              
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
