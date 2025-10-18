import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useTour, useAvailabilities } from "@/hooks/use-tours";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Calendar, Users, Euro, CreditCard, Check, CalendarSearch } from "lucide-react";
import DateSelector from "@/components/booking/DateSelector";
import ParticipantForm from "@/components/booking/ParticipantForm";
import PaymentForm from "@/components/booking/PaymentForm";
import RequestSent from "@/components/booking/RequestSent";
import { Link } from "wouter";
import { getLocalizedText } from "@/lib/tour-utils";

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
  paymentStatus?: string | null;
  stripePaymentIntentId?: string | null;
  additionalInfo?: any;
  meetingPoint?: string | null;
  confirmedDate?: string | null;
  confirmedTime?: string | null;
  confirmedMeetingPoint?: string | null;
  adminNotes?: string | null;
  language?: string | null;
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

const steps = [
  { id: 1, name: 'dateTime', icon: Calendar },
  { id: 2, name: 'participants', icon: Users },
  { id: 3, name: 'review', icon: CalendarSearch },
  { id: 4, name: 'requestSent', icon: Check }
];

export default function Booking() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const tourId = parseInt(id || "0");
  
  // Initialize with values from localStorage if they exist (for recovery from navigation issues)
  const storedStep = localStorage.getItem('currentBookingStep');
  const storedReference = localStorage.getItem('currentBookingReference');
  
  const [currentStep, setCurrentStep] = useState(storedStep ? parseInt(storedStep) : 1);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [bookingReference, setBookingReference] = useState<string>(storedReference || "");

  const { tour, isLoading: isTourLoading } = useTour(tourId);
  const { availabilities } = useAvailabilities(tourId);

  useEffect(() => {
    if (!isTourLoading && !tour) {
      setLocation("/");
    }
  }, [tour, isTourLoading, setLocation]);

  useEffect(() => {
  if (storedStep === '4') {
    localStorage.removeItem('currentBookingStep');
    localStorage.removeItem('currentBookingReference');
    setCurrentStep(1);
    setBookingReference("");
    setBookingData({});
  }
}, []);

  if (isTourLoading || !tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentStep / steps.length) * 100;

  const handleDateTimeSelect = (data: { date: string; time: string; availabilityId: number }) => {
    setBookingData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleParticipantsSelect = (data: Partial<BookingData>, moveStep = false) => {
    setBookingData(prev => ({ ...prev, ...data }));
    if (moveStep) setCurrentStep(3);
  };

  const handlePaymentComplete = (reference: string) => {
    console.log("Payment complete! Booking reference:", reference);
    
    // Important: set these states synchronously to ensure consistency
    setBookingReference(reference);
    setCurrentStep(4);
    
    // Also store in localStorage as a backup
    localStorage.setItem('currentBookingReference', reference);
    localStorage.setItem('currentBookingStep', '4');
    
    // Force rerender to ensure the confirmation page shows
    setTimeout(() => {
      console.log("Checking if confirmation step is active, current step:", currentStep);
      if (currentStep !== 4) {
        console.log("Forcing step to confirmation");
        setCurrentStep(4);
      }
    }, 200);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateTotal = () => {
    if (bookingData.discountDetails && typeof bookingData.discountDetails.totalAmount === 'number') {
      return bookingData.discountDetails.totalAmount;
    }
    const participants = bookingData.numberOfParticipants || 1;
    return tour.priceType === "per_group" ? tour.price : participants * tour.price;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/tour/${tour.id}`}>
              <Button variant="ghost" className="mb-4">
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('booking.backToTour')}
              </Button>
            </Link>
            
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('booking.requestTour')}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 truncate-mobile">
                {getLocalizedText(tour.name, i18n.language)}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-6">
              <Progress value={progressPercentage} className="h-2 mb-4" />
              <div className="flex justify-between">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStep;
                  const isCompleted = step.id < currentStep;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isActive
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isActive || isCompleted
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400'
                        }`}
                      >
                        {t(`booking.steps.${step.name}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  {currentStep === 1 && (
                    <DateSelector
                      availabilities={availabilities || []}
                      isLoading={!availabilities && isTourLoading}
                      onSelect={handleDateTimeSelect}
                      onCancel={() => setLocation(`/tour/${tourId}`)}
                      selectedDate={bookingData.date}
                      selectedTime={bookingData.time}
                      selectedAvailabilityId={bookingData.availabilityId}
                    />
                  )}
                  
                  {currentStep === 2 && (
                    <ParticipantForm
                      tour={tour}
                      onSelect={handleParticipantsSelect}
                      onBack={handleBack}
                      maxParticipants={tour.maxGroupSize}
                      totalPrice={calculateTotal()}
                      availableSpots={bookingData.availabilityId ? availabilities?.find(a => a.id === bookingData.availabilityId)?.spotsLeft || 0 : 0}
                    />
                  )}
                  
                  {currentStep === 3 && (
                    <PaymentForm
                      tour={tour}
                      bookingData={bookingData as BookingData}
                      totalAmount={calculateTotal()}
                      onPaymentComplete={handlePaymentComplete}
                      onBack={handleBack}
                    />
                  )}
                  
                  {currentStep === 4 && bookingReference && (
                    <RequestSent
                      tour={tour}
                      bookingData={bookingData as BookingData}
                      bookingReference={bookingReference}
                      totalAmount={calculateTotal()}
                    />
                  )}
                  
                  {/* No hidden elements needed here */}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Booking Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky" style={{ top: 'calc(var(--navbar-height, 56px) + 2rem)' }}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('booking.requestSummary')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tour Info */}
                  <div className="flex space-x-3">
                    <img
                      src={tour.imageUrl}
                      alt={getLocalizedText(tour.name)}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {getLocalizedText(tour.name)}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getLocalizedText(tour.duration)}
                      </p>
                      {tour.badge && getLocalizedText(tour.badge) && (
                        <Badge className="text-xs mt-1" variant="secondary">
                          {getLocalizedText(tour.badge)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Booking Details */}
                  <div className="space-y-3">
                    {bookingData.date && bookingData.time && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('booking.dateTime')}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(bookingData.date).toLocaleDateString("pt-PT")} {bookingData.time}
                        </span>
                      </div>
                    )}
                    {bookingData.numberOfParticipants && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('booking.participants')}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {bookingData.numberOfParticipants} {t('booking.people')}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {tour.priceType === "per_group" ? t('booking.pricePerGroup') : t('booking.pricePerPerson')}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        €{(tour.price / 100).toFixed(2)}
                      </span>
                    </div>
                    {bookingData.discountDetails && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{t('booking.originalPrice')}</span>
                          <span className="font-medium text-gray-900 dark:text-white">€{(bookingData.discountDetails.originalAmount / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{t('booking.discount')}{bookingData.discountDetails.code ? ` (${bookingData.discountDetails.code})` : ''}</span>
                          <span className="font-medium text-gray-900 dark:text-white">-€{(bookingData.discountDetails.discountAmount / 100).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('booking.total')}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      €{(calculateTotal() / 100).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
