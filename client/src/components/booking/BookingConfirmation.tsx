import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar } from "lucide-react";
import { Tour } from "@shared/schema";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { AddToCalendar } from "@/lib/calendar";

interface BookingConfirmationProps {
  bookingData: any;
  tour?: Tour;
  onClose: () => void;
}

export default function BookingConfirmation({
  bookingData,
  tour,
  onClose
}: BookingConfirmationProps) {
  const handleAddToCalendar = () => {
    if (tour) {
      AddToCalendar({
        title: `Lisboa Tours: ${tour.name}`,
        description: tour.description,
        location: bookingData.meetingPoint || "Lisboa, Portugal",
        startDate: bookingData.date,
        startTime: bookingData.time,
        duration: parseInt(tour.duration.split(' ')[0]), // E.g., "3 hours" -> 3
      });
    }
  };

  return (
    <div className="text-center py-6">
      <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10" />
      </div>
      
      <h4 className="text-2xl font-display font-bold mb-3">Booking Confirmed!</h4>
      <p className="text-neutral-dark/80 mb-6">
        Your tour has been successfully booked. A confirmation email has been sent to your email address.
      </p>
      
      <div className="bg-neutral-light p-4 rounded-md text-left mb-6">
        <h5 className="font-semibold mb-2">Booking Details</h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-neutral-dark/70">Tour:</div>
          <div>{tour?.name}</div>
          
          <div className="text-neutral-dark/70">Date:</div>
          <div>{bookingData.date ? formatDate(bookingData.date) : "Not specified"}</div>
          
          <div className="text-neutral-dark/70">Time:</div>
          <div>{bookingData.time ? formatTime(bookingData.time) : "Not specified"}</div>
          
          <div className="text-neutral-dark/70">Participants:</div>
          <div>{bookingData.numberOfParticipants} people</div>
          
          <div className="text-neutral-dark/70">Total Amount:</div>
          <div>{formatCurrency(bookingData.totalAmount)}</div>
          
          <div className="text-neutral-dark/70">Booking Reference:</div>
          <div>{bookingData.bookingReference}</div>
        </div>
      </div>
      
      <div className="mb-6 text-left">
        <h5 className="font-semibold mb-2">Meeting Point</h5>
        <p className="text-neutral-dark/80 mb-2">
          {bookingData.meetingPoint || "We'll meet at the entrance of the tour's main location, 15 minutes before the tour starts."}
        </p>
        <p className="text-neutral-dark/80">
          Please bring comfortable walking shoes, water, and sun protection.
        </p>
      </div>
      
      <div className="flex justify-center gap-4">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          Close
        </Button>
        <Button 
          onClick={handleAddToCalendar}
          className="flex items-center"
        >
          <Calendar className="mr-2 h-4 w-4" /> Add to Calendar
        </Button>
      </div>
    </div>
  );
}
