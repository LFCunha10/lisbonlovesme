import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useTour } from "@/hooks/use-tours";
import { useBookingModal } from "@/hooks/use-bookings";
import DateSelector from "./DateSelector";
import ParticipantInfo from "./ParticipantInfo";
import PaymentForm from "./PaymentForm";
import BookingConfirmation from "./BookingConfirmation";
import { Skeleton } from "@/components/ui/skeleton";

export enum BookingStep {
  DATE_SELECTION = 1,
  PARTICIPANT_INFO = 2,
  PAYMENT = 3,
  CONFIRMATION = 4
}

interface BookingModalProps {
  selectedTourId?: number;
}

export function BookingModal({ selectedTourId }: BookingModalProps = {}) {
  const { isOpen, selectedTour: hookSelectedTour, closeBookingModal } = useBookingModal();
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.DATE_SELECTION);
  const [bookingData, setBookingData] = useState({
    tourId: 0,
    availabilityId: 0,
    date: "",
    time: "",
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: "",
    numberOfParticipants: 2,
    specialRequests: "",
    totalAmount: 0,
    bookingReference: ""
  });

  // Use either the prop passed tourId or the one from the hook
  const effectiveTourId = selectedTourId || hookSelectedTour;
  const { tour, isLoading } = useTour(effectiveTourId);

  useEffect(() => {
    if (isOpen && effectiveTourId) {
      setBookingData(prev => ({
        ...prev,
        tourId: effectiveTourId
      }));
    }
  }, [isOpen, effectiveTourId]);

  // Reset step when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(BookingStep.DATE_SELECTION);
    }
  }, [isOpen]);

  const handleNext = () => {
    setCurrentStep(prev => prev + 1 as BookingStep);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1 as BookingStep);
  };

  const updateBookingData = (data: Partial<typeof bookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case BookingStep.DATE_SELECTION:
        return (
          <DateSelector
            tourId={bookingData.tourId}
            onNext={handleNext}
            onCancel={closeBookingModal}
            onSelect={updateBookingData}
            selectedDate={bookingData.date}
            selectedTime={bookingData.time}
            selectedAvailabilityId={bookingData.availabilityId}
          />
        );
      case BookingStep.PARTICIPANT_INFO:
        return (
          <ParticipantInfo
            onNext={handleNext}
            onPrevious={handlePrevious}
            onUpdate={updateBookingData}
            bookingData={bookingData}
            tour={tour}
          />
        );
      case BookingStep.PAYMENT:
        return (
          <PaymentForm
            onPrevious={handlePrevious}
            onComplete={handleNext}
            bookingData={bookingData}
            tour={tour}
            updateBookingData={updateBookingData}
          />
        );
      case BookingStep.CONFIRMATION:
        return (
          <BookingConfirmation
            bookingData={bookingData}
            tour={tour}
            onClose={closeBookingModal}
          />
        );
      default:
        return null;
    }
  };

  const renderHeader = () => {
    if (currentStep === BookingStep.CONFIRMATION) {
      return null; // No header for confirmation step
    }

    return (
      <DialogHeader className="border-b pb-4">
        <div className="flex justify-between items-center">
          <DialogTitle className="text-2xl font-display font-bold">
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              tour?.name || "Book a Tour"
            )}
          </DialogTitle>
          <button
            onClick={closeBookingModal}
            className="text-neutral-dark/70 hover:text-neutral-dark"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <DialogDescription className="mt-2">
          {currentStep === BookingStep.DATE_SELECTION && "Select a date and time for your tour"}
          {currentStep === BookingStep.PARTICIPANT_INFO && "Enter participant information"}
          {currentStep === BookingStep.PAYMENT && "Complete your booking with payment"}
        </DialogDescription>
      </DialogHeader>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeBookingModal()}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0">
        {renderHeader()}
        <div className="p-6">{renderStepContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
