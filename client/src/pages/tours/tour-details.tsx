import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useTour, useTestimonials } from "@/hooks/use-tours";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  Users, 
  MapPin, 
  Euro, 
  Star,
  Calendar,
  ChevronLeft
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TourDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const tourId = parseInt(id || "0");
  
  const { tour, isLoading: isTourLoading, error: tourError } = useTour(tourId);
  const { testimonials, isLoading: isTestimonialsLoading } = useTestimonials(tourId);

  if (isTourLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <Skeleton className="h-64 w-full rounded-lg mb-6" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-24 w-full mb-6" />
            </div>
            <div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tourError || !tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('tour.notFound')}
            </h1>
            <Link href="/">
              <Button variant="outline">
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('tour.backToHome')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t('tour.backToTours')}
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Tour Information */}
          <div>
            {/* Hero Image */}
            <div className="relative mb-6">
              <img
                src={tour.imageUrl}
                alt={tour.name}
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
              {tour.badge && (
                <Badge 
                  className={`absolute top-4 left-4 ${
                    tour.badgeColor === 'green' ? 'bg-green-500' :
                    tour.badgeColor === 'blue' ? 'bg-blue-500' :
                    tour.badgeColor === 'purple' ? 'bg-purple-500' :
                    'bg-red-500'
                  } text-white`}
                >
                  {tour.badge}
                </Badge>
              )}
            </div>

            {/* Tour Title and Description */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {tour.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {tour.description}
              </p>
            </div>

            {/* Tour Details */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  {t('tour.details')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('tour.duration')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{tour.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('tour.maxGroupSize')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{tour.maxGroupSize} {t('tour.people')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('tour.difficulty')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{tour.difficulty}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Euro className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('tour.price')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">€{tour.price}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            {testimonials && testimonials.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    {t('tour.reviews')}
                  </h3>
                  <div className="space-y-4">
                    {testimonials.slice(0, 3).map((testimonial) => (
                      <div key={testimonial.id} className="border-l-4 border-primary pl-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < testimonial.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {testimonial.customerName} ({testimonial.customerCountry})
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          "{testimonial.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div>
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    €{tour.price}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('tour.perPerson')}
                  </p>
                </div>

                <Separator className="mb-6" />

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('tour.duration')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{tour.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('tour.maxGroupSize')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{tour.maxGroupSize} {t('tour.people')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('tour.difficulty')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{tour.difficulty}</span>
                  </div>
                </div>

                <Link href={`/book/${tour.id}`}>
                  <Button className="w-full text-lg py-6" size="lg">
                    <Calendar className="w-5 h-5 mr-2" />
                    {t('tour.bookNow')}
                  </Button>
                </Link>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  {t('tour.freeBooking')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}