import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Users, MapPin, Star, Send, ArrowLeft, Euro } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Tour, Testimonial } from "@shared/schema";
import { marked } from 'marked';

export default function TourDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const tourId = parseInt(id as string);

  const { data: tour, isLoading: tourLoading } = useQuery<Tour>({
    queryKey: [`/api/tours/${tourId}`],
    enabled: !!tourId && !isNaN(tourId),
    queryFn: async () => {
      const response = await fetch(`/api/tours/${tourId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tour');
      }
      return response.json();
    }
  });

  const { data: testimonials, isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials'],
  });

  if (tourLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-96 w-full mb-8 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('common.tourNotFound')}
          </h1>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.backToHome')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tourTestimonials = testimonials?.filter(t => t.tourId === tourId) || [];
  const averageRating = tourTestimonials.length > 0 
    ? tourTestimonials.reduce((sum, t) => sum + t.rating, 0) / tourTestimonials.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.backToHome')}
          </Button>
        </Link>
      </div>

      {/* Hero Image */}
      <div className="relative h-96 mb-8">
        <img
          src={tour.imageUrl}
          alt={tour.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <div className="flex items-center space-x-4 mb-4">
              <h1 className="text-4xl font-bold text-white">
                {tour.name}
              </h1>
              {tour.badge && (
                <Badge className="bg-primary text-primary-foreground">
                  {tour.badge}
                </Badge>
              )}
            </div>
            {tourTestimonials.length > 0 && (
              <div className="flex items-center space-x-2 text-white">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-medium">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-gray-200">
                  ({tourTestimonials.length} {tourTestimonials.length === 1 ? t('tours.review') : t('tours.reviews')})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Mobile Booking Section - Show only on mobile, right after banner */}
        <div className="lg:hidden mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatCurrency(tour.price)}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('tours.perPerson')}
                </p>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('tours.duration')}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {tour.duration}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('tours.groupSize')}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {tour.maxGroupSize} {t('tours.people')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('tours.difficulty')}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {tour.difficulty}
                  </span>
                </div>
              </div>

              <Link href={`/book/${tour.id}`}>
                <Button className="w-full text-lg py-6" size="lg">
                  <Send className="w-5 h-5 mr-2" />
                  {t('tours.sendYourRequest')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tour Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  {t('tours.tourDetails')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {t('tours.duration')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">{tour.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {t('tours.groupSize')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {tour.maxGroupSize} {t('tours.people')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {t('tours.difficulty')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">{tour.difficulty}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Euro className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {t('tours.price')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(tour.price)} {t('tours.perPerson')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  {t('tours.aboutTour')}
                </h2>
                <div 
                  className="text-gray-600 dark:text-gray-300 leading-relaxed prose prose-gray dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked.parse(tour.description) }}
                />
              </CardContent>
            </Card>

            {/* Reviews */}
            {tourTestimonials.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    {t('tours.reviews')} ({tourTestimonials.length})
                  </h2>
                  <div className="space-y-6">
                    {tourTestimonials.slice(0, 3).map((testimonial) => (
                      <div key={testimonial.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-6 last:pb-0">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {testimonial.customerName}
                          </h4>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < testimonial.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          {testimonial.text}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {testimonial.customerCountry}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Desktop Booking Sidebar - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {formatCurrency(tour.price)}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('tours.perPerson')}
                  </p>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('tours.duration')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {tour.duration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('tours.groupSize')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {tour.maxGroupSize} {t('tours.people')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('tours.difficulty')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {tour.difficulty}
                    </span>
                  </div>
                </div>

                <Link href={`/book/${tour.id}`}>
                  <Button className="w-full text-lg py-6" size="lg">
                    <Send className="w-5 h-5 mr-2" />
                    {t('tours.sendYourRequest')}
                  </Button>
                </Link>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}