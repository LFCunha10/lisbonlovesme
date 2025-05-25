import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, ChevronLeft, Lock, Calendar, Users, MapPin, Euro } from "lucide-react";
import type { Tour } from "@shared/schema";

interface BookingData {
  date: string;
  time: string;
  availabilityId: number;
  numberOfParticipants: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests: string;
}

interface PaymentFormProps {
  tour: Tour;
  bookingData: BookingData;
  totalAmount: number;
  onPaymentComplete: (reference: string) => void;
  onBack: () => void;
}

export default function PaymentForm({ tour, bookingData, totalAmount, onPaymentComplete, onBack }: PaymentFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const createBooking = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating booking with data:", data);
      // Send the API request
      const response = await apiRequest('POST', '/api/bookings', data);
      // Parse the JSON response
      const bookingData = await response.json();
      console.log("Server response:", bookingData);
      return bookingData;
    },
    onSuccess: (bookingData) => {
      console.log("Booking successful:", bookingData);
      toast({
        title: t('booking.success'),
        description: t('booking.successMessage'),
      });
      
      if (bookingData && bookingData.bookingReference) {
        // Store booking reference in localStorage for retrieval in case of navigation issues
        localStorage.setItem('lastBookingReference', bookingData.bookingReference);
        console.log("Using booking reference from response:", bookingData.bookingReference);
        
        // Create a slight delay to ensure the state is properly updated
        window.setTimeout(() => {
          onPaymentComplete(bookingData.bookingReference);
        }, 100);
      } else {
        console.error("Booking created but reference is missing");
        toast({
          title: t('booking.error'),
          description: t('booking.referenceError'),
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({
        title: t('booking.error'),
        description: error.message || t('booking.errorMessage'),
        variant: "destructive",
      });
    }
  });

  // Check if we're in test mode (defaulting to true for easier testing)
  const isTestMode = true;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Create the booking data with consistent structure
      const bookingPayload = {
        tourId: tour.id,
        availabilityId: bookingData.availabilityId,
        customerFirstName: bookingData.customerFirstName,
        customerLastName: bookingData.customerLastName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        numberOfParticipants: bookingData.numberOfParticipants,
        specialRequests: bookingData.specialRequests || null,
        paymentStatus: 'completed',
        totalAmount
      };
      
      console.log('Using test payment mode - automatic approval');
      
      try {
        // Create booking using the more reliable fetch API
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingPayload),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        // Parse response
        const data = await response.json();
        console.log('Booking created successfully:', data);
        
        // Show success message
        toast({
          title: t('booking.success'),
          description: t('booking.successMessage'),
        });
        
        if (data && data.bookingReference) {
          // 1. Store in localStorage (in case of page refresh)
          localStorage.setItem('currentBookingReference', data.bookingReference);
          localStorage.setItem('currentBookingStep', '4');
          
          // 2. Save reference in URL
          const url = new URL(window.location.href);
          url.searchParams.set('reference', data.bookingReference);
          window.history.replaceState({}, '', url.toString());
          
          // 3. Call completion handler with a slight delay to ensure state update
          setTimeout(() => {
            console.log("Advancing to confirmation step with reference:", data.bookingReference);
            onPaymentComplete(data.bookingReference);
          }, 250);
        } else {
          throw new Error('No booking reference returned from server');
        }
      } catch (apiError: any) {
        console.error('API error creating booking:', apiError);
        throw new Error(apiError.message || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      setIsProcessing(false);
      toast({
        title: t('booking.error'),
        description: error.message || t('booking.paymentProcessingError'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('booking.payment')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('booking.paymentSubtitle')}
        </p>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('booking.bookingSummary')}
          </h3>
          
          <div className="flex space-x-4 mb-4">
            <img
              src={tour.imageUrl}
              alt={tour.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {tour.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {tour.duration}
              </p>
              {tour.badge && (
                <Badge variant="secondary" className="text-xs">
                  {tour.badge}
                </Badge>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{t('booking.dateTime')}</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(bookingData.date).toLocaleDateString()} {bookingData.time}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{t('booking.participants')}</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {bookingData.numberOfParticipants} {bookingData.numberOfParticipants === 1 ? t('booking.person') : t('booking.people')}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Euro className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{t('booking.pricePerPerson')}</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">€{(tour.price / 100).toFixed(2)}</span>
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('booking.total')}
              </span>
              <span className="text-2xl font-bold text-primary">
                €{(totalAmount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('booking.customerInformation')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">{t('booking.name')}</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {bookingData.customerFirstName} {bookingData.customerLastName}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">{t('booking.email')}</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {bookingData.customerEmail}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">{t('booking.phone')}</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {bookingData.customerPhone}
              </p>
            </div>
            {bookingData.specialRequests && (
              <div className="md:col-span-2">
                <span className="text-gray-600 dark:text-gray-400">{t('booking.specialRequests')}</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {bookingData.specialRequests}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Section */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <Lock className="w-5 h-5" />
              <span className="text-sm font-medium">{t('booking.securePayment')}</span>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                {t('booking.demoNotice')}
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                {t('booking.demoDescription')}
              </p>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full text-lg py-6"
              size="lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {isProcessing ? t('booking.processing') : `${t('booking.payNow')} €${(totalAmount / 100).toFixed(2)}`}
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('booking.paymentNotice')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-start pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('booking.back')}</span>
        </Button>
      </div>
    </div>
  );
}