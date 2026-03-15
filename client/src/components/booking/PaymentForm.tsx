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
import { getLocalizedText } from "@/lib/tour-utils";
import { formatDurationHours } from "@shared/duration";
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
  specialRequests: string | null;
  discountCode?: string;
  discountDetails?: {
    code: string;
    name: string;
    category: string;
    value: number;
    originalAmount: number;
    discountAmount: number;
    totalAmount: number;
  } | null;
}

interface PaymentFormProps {
  tour: Tour;
  bookingData: BookingData;
  totalAmount: number;
  onPaymentComplete: (reference: string) => void;
  onBack: () => void;
}

export default function PaymentForm({ tour, bookingData, totalAmount, onPaymentComplete, onBack }: PaymentFormProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const createBooking = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/bookings', {
        tourId: tour.id,
        availabilityId: bookingData.availabilityId,
        customerFirstName: bookingData.customerFirstName,
        customerLastName: bookingData.customerLastName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        numberOfParticipants: bookingData.numberOfParticipants,
        specialRequests: bookingData.specialRequests || null,
        discountCode: bookingData.discountCode,
        language: i18n.language,
      });

      return response.json();
    },
    onSuccess: (bookingData) => {
      setIsProcessing(false);
      toast({
        title: t('booking.requestSent'),
        description: t('booking.requestSentDescription'),
      });
      
      if (bookingData && bookingData.bookingReference) {
        localStorage.setItem('lastBookingReference', bookingData.bookingReference);
        localStorage.setItem('currentBookingReference', bookingData.bookingReference);
        localStorage.setItem('currentBookingStep', '4');

        const url = new URL(window.location.href);
        url.searchParams.set('reference', bookingData.bookingReference);
        window.history.replaceState({}, '', url.toString());

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

  const handlePayment = async () => {
    setIsProcessing(true);

    createBooking.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('booking.reviewRequest')}
        </h2>
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
              alt={getLocalizedText(tour.name, i18n.language)}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {getLocalizedText(tour.name, i18n.language)}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {formatDurationHours(tour.duration, i18n.language)}
              </p>
              {tour.badge && getLocalizedText(tour.badge, i18n.language) && (
                <Badge variant="secondary" className="text-xs">
                  {getLocalizedText(tour.badge, i18n.language)}
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
                {new Date(bookingData.date).toLocaleDateString("pt-PT")} - {bookingData.time}
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
                <span className="text-gray-600 dark:text-gray-400">
                  {tour.priceType === "per_group" ? t('booking.pricePerGroup') : t('booking.pricePerPerson')}
                </span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">€{(tour.price / 100).toFixed(2)}</span>
            </div>

            {bookingData.discountDetails && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('booking.originalPrice')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">€{(bookingData.discountDetails.originalAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('booking.discount')}{bookingData.discountDetails.code ? ` (${bookingData.discountDetails.code})` : ''}</span>
                  <span className="font-medium text-gray-900 dark:text-white">-€{(bookingData.discountDetails.discountAmount / 100).toFixed(2)}</span>
                </div>
              </>
            )}

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
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full text-lg py-6"
              size="lg"
            >
              {isProcessing ? t('booking.processing') : `${t('booking.sendRequest')}`}
            </Button>
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
