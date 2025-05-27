import React, { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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

const reviewSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerCountry: z.string().min(2, "Country must be at least 2 characters"),
  rating: z.number().min(1, "Please select a rating").max(5, "Maximum rating is 5"),
  text: z.string().min(10, "Review must be at least 10 characters long").max(500, "Review must be less than 500 characters")
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function ReviewPage() {
  const { t } = useTranslation();
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
  const { data: tour } = useQuery({
    queryKey: ['/api/tours', booking?.tourId],
    enabled: !!booking?.tourId,
  });

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
        title: "Review Submitted!",
        description: "Thank you for your feedback. Your review will be published after approval.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Booking Not Found</CardTitle>
            <CardDescription className="text-center">
              The booking reference you're looking for doesn't exist or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
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
              Review Submitted!
            </CardTitle>
            <CardDescription className="text-center">
              Thank you for sharing your experience with us. Your review will be published after our team reviews it.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              We appreciate your feedback and hope to welcome you back for another amazing tour in Lisbon!
            </p>
            <Link href="/">
              <Button className="w-full">
                Explore More Tours
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
                Back to Home
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Share Your Experience</CardTitle>
              <CardDescription className="text-center">
                How was your <strong>{tour?.name}</strong> tour with Lisbonlovesme?
                <br />
                Booking Reference: <span className="font-mono">{bookingReference}</span>
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
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
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
                          <FormLabel>Your Country</FormLabel>
                          <FormControl>
                            <Input placeholder="United States" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormLabel>Rating</FormLabel>
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
                      <p className="text-sm text-red-600 mt-1">Please select a rating</p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Review</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your experience with the tour. What did you enjoy most? Would you recommend it to others?"
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
                    {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
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