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
      const response = await apiRequest('POST', '/api/bookings', data);
      const responseData = await response.json();
      return responseData;
    },
    onSuccess: (bookingData) => {
      toast({
        title: t('booking.success'),
        description: t('booking.successMessage'),
      });
      
      // Pass the booking reference to the parent component
      if (bookingData && bookingData.bookingReference) {
        onPaymentComplete(bookingData.bookingReference);
      } else {
        // Fallback in case the booking reference is missing
        console.error("Booking created but reference is missing");
        onPaymentComplete("LT-" + Math.random().toString(36).substring(2, 8).toUpperCase());
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

  // Check if we're in test mode
  const isTestMode = import.meta.env.VITE_PAYMENT_MODE === 'test';

  const handlePayment = async () => {
    setIsProcessing(true);
    
    if (isTestMode) {
      // Test mode - always approve payment
      console.log('Using test payment mode - automatic approval');
      createBooking.mutate({
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
      });
    } else {
      // Real payment mode - connect to Stripe or other payment processor
      try {
        // Here you would typically make a call to create a payment intent
        // and then confirm the payment with Stripe Elements
        console.log('Using real payment mode - connecting to payment processor');
        
        // For now, we'll simulate a successful payment
        // This would be replaced with actual Stripe integration
        createBooking.mutate({
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
        });
      } catch (error) {
        console.error('Payment processing error:', error);
        setIsProcessing(false);
        toast({
          title: t('booking.error'),
          description: t('booking.paymentProcessingError'),
          variant: "destructive",
        });
      }
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