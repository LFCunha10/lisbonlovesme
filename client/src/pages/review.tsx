import React, { useMemo, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getLocalizedText } from "@/lib/tour-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Tour } from "@shared/schema";

// Schema will be created inside component to use translations for messages

type ReviewFormValues = {
  customerName: string;
  customerCountry: string;
  rating: number;
  text: string;
};

export default function ReviewPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/review/:bookingReference");
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const bookingReference = params?.bookingReference;

  // Fetch booking details to verify it exists and get tour info
  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['/api/bookings', bookingReference],
    enabled: !!bookingReference,
    queryFn: async () => {
      const response = await fetch(`/api/bookings/reference/${bookingReference}`);
      if (!response.ok) {
        throw new Error('Booking not found');
      }
      return response.json();
    }
  });

  // Fetch tour details
  const { data: tour } = useQuery<Tour>({
    queryKey: ['/api/tours', booking?.tourId],
    enabled: !!booking?.tourId,
  });

  const reviewSchema = useMemo(() => z.object({
    customerName: z
      .string()
      .min(2, t('review.validation.nameMin', 'Name must be at least 2 characters')),
    customerCountry: z
      .string()
      .min(2, t('review.validation.countryMin', 'Country must be at least 2 characters')),
    rating: z
      .number()
      .min(1, t('review.validation.selectRating', 'Please select a rating'))
      .max(5, t('review.validation.maxRating', 'Maximum rating is 5')),
    text: z
      .string()
      .min(10, t('review.validation.textMin', 'Review must be at least 10 characters long'))
      .max(500, t('review.validation.textMax', 'Review must be less than 500 characters')),
  }), [i18n.language]);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      customerName: "",
      customerCountry: "",
      rating: 0,
      text: ""
    }
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      return apiRequest("POST", "/api/testimonials", {
        ...data,
        tourId: booking.tourId,
        bookingReference: bookingReference
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
      toast({
        title: t('review.submittedToastTitle'),
        description: t('review.submittedToastDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('review.errorTitle'),
        description: error.message || t('review.errorDefault'),
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ReviewFormValues) => {
    submitReviewMutation.mutate({
      ...data,
      rating
    });
  };

  if (bookingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{t('review.notFoundTitle')}</CardTitle>
            <CardDescription className="text-center">
              {t('review.notFoundMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.backToHome')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              {t('review.submittedTitle')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('review.submittedDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">{t('review.appreciation')}</p>
            <Link href="/">
              <Button className="w-full">
                {t('review.exploreMoreTours')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.backToHome')}
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t('review.title')}</CardTitle>
              <CardDescription className="text-center">
                {t('review.howWasTour', { tour: tour ? getLocalizedText(tour.name, i18n.language) : '' })}
                <br />
                {t('review.bookingReference')}: <span className="font-mono">{bookingReference}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('review.yourName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('review.namePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customerCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('review.yourCountry')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('review.countryPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormLabel>{t('review.rating')}</FormLabel>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 cursor-pointer transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {rating > 0 && `${rating} of 5 stars`}
                      </span>
                    </div>
                    {rating === 0 && form.formState.isSubmitted && (
                      <p className="text-sm text-red-600 mt-1">{t('review.pleaseSelectRating')}</p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('review.yourReview')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('review.textPlaceholder')}
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submitReviewMutation.isPending || rating === 0}
                  >
                    {submitReviewMutation.isPending ? t('review.submitting') : t('review.submit')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
