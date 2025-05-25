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
import { ChevronLeft, Calendar, Users, Euro, CreditCard, Check } from "lucide-react";
import DateSelector from "@/components/booking/DateSelector";
import ParticipantForm from "@/components/booking/ParticipantForm";
import PaymentForm from "@/components/booking/PaymentForm";
import BookingConfirmation from "@/components/booking/BookingConfirmation";
import { Link } from "wouter";

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

const steps = [
  { id: 1, name: 'dateTime', icon: Calendar },
  { id: 2, name: 'participants', icon: Users },
  { id: 3, name: 'payment', icon: CreditCard },
  { id: 4, name: 'confirmation', icon: Check }
];

export default function Booking() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const tourId = parseInt(id || "0");
  
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [bookingReference, setBookingReference] = useState<string>("");

  const { tour, isLoading: isTourLoading } = useTour(tourId);
  const { availabilities } = useAvailabilities(tourId);

  useEffect(() => {
    if (!isTourLoading && !tour) {
      setLocation("/");
    }
  }, [tour, isTourLoading, setLocation]);

  if (isTourLoading || !tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
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

  const handleParticipantsSelect = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handlePaymentComplete = (reference: string) => {
    console.log("Payment complete! Booking reference:", reference);
    setBookingReference(reference);
    // Force a small delay to ensure state updates properly
    setTimeout(() => {
      setCurrentStep(4);
    }, 100);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateTotal = () => {
    return (bookingData.numberOfParticipants || 1) * tour.price;
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('booking.title')}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {tour.name}
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
                  
                  {currentStep === 4 && (
                    <BookingConfirmation
                      tour={tour}
                      bookingData={bookingData as BookingData}
                      bookingReference={bookingReference}
                      totalAmount={calculateTotal()}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Booking Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('booking.summary')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tour Info */}
                  <div className="flex space-x-3">
                    <img
                      src={tour.imageUrl}
                      alt={tour.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {tour.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {tour.duration}
                      </p>
                      {tour.badge && (
                        <Badge className="text-xs mt-1" variant="secondary">
                          {tour.badge}
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
                          {new Date(bookingData.date).toLocaleDateString()} {bookingData.time}
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
                        {t('booking.pricePerPerson')}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        €{(tour.price / 100).toFixed(2)}
                      </span>
                    </div>
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

                  {/* Free Booking Notice */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {t('booking.freeBooking')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}