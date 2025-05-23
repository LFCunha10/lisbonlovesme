import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useAvailabilities } from "@/hooks/use-tours";
import { useCalendar } from "@/hooks/use-calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { isPastDate, formatTime } from "@/lib/utils";

interface DateSelectorProps {
  tourId: number;
  onNext: () => void;
  onCancel: () => void;
  onSelect: (data: { date: string; time: string; availabilityId: number }) => void;
  selectedDate: string;
  selectedTime: string;
  selectedAvailabilityId: number;
}

export default function DateSelector({
  tourId,
  onNext,
  onCancel,
  onSelect,
  selectedDate,
  selectedTime,
  selectedAvailabilityId
}: DateSelectorProps) {
  const { availabilities, isLoading, error } = useAvailabilities(tourId);
  const [date, setDate] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  );
  const [time, setTime] = useState<string>(selectedTime);
  const [availabilityId, setAvailabilityId] = useState<number>(selectedAvailabilityId);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; availabilityId: number; spotsLeft: number }[]>([]);
  
  const { disabledDays } = useCalendar(availabilities);

  useEffect(() => {
    if (date && availabilities) {
      // Convert to local date string format (YYYY-MM-DD) consistently
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const slots = availabilities
        .filter(a => a.date === dateStr && a.spotsLeft > 0)
        .reduce((acc, a) => {
          // Remove duplicates by time
          if (!acc.some(slot => slot.time === a.time)) {
            acc.push({
              time: a.time,
              availabilityId: a.id,
              spotsLeft: a.spotsLeft
            });
          }
          return acc;
        }, [] as Array<{time: string; availabilityId: number; spotsLeft: number}>)
        .sort((a, b) => a.time.localeCompare(b.time));
      
      setAvailableTimeSlots(slots);
      
      // If there are no slots available or the previously selected time is no longer available,
      // reset the time selection
      if (slots.length === 0 || !slots.some(slot => slot.time === time)) {
        setTime("");
        setAvailabilityId(0);
      }
    } else {
      setAvailableTimeSlots([]);
      setTime("");
      setAvailabilityId(0);
    }
  }, [date, availabilities]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
  };

  const handleTimeSelect = (newTime: string, newAvailabilityId: number) => {
    setTime(newTime);
    setAvailabilityId(newAvailabilityId);
  };

  const handleNext = () => {
    if (date && time && availabilityId) {
      // Convert to local date string format (YYYY-MM-DD) consistently
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      onSelect({
        date: dateStr,
        time,
        availabilityId
      });
      onNext();
    }
  };

  return (
    <div>
      <h4 className="text-xl font-semibold mb-4">Select Date & Time</h4>
      
      <div className="mb-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-error">
            <p>Failed to load availability: {error.message}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="border rounded-md p-4 mb-6"
              disabled={(date) => {
                // Disable past dates and days of the week that don't have availabilities
                const isPast = isPastDate(date);
                const isDayOfWeekDisabled = disabledDays.includes(date.getDay());
                
                // Convert to local date string format (YYYY-MM-DD) to check against availabilities
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                // Check if there are any availabilities for this date with spots left
                const hasAvailability = availabilities?.some(a => 
                  a.date === dateStr && a.spotsLeft > 0
                );
                
                // Disable if past date, day of week with no availabilities, or no specific availabilities for this date
                return isPast || isDayOfWeekDisabled || !hasAvailability;
              }}
            />
            
            <div className="flex items-center text-sm mb-6">
              <div className="flex items-center mr-4">
                <div className="w-4 h-4 bg-primary mr-2 rounded-sm"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-neutral-light/70 mr-2 rounded-sm"></div>
                <span>Unavailable</span>
              </div>
            </div>
            
            <h5 className="font-semibold mb-2">
              {date ? (
                availableTimeSlots.length > 0 
                  ? "Available Time Slots" 
                  : "No available time slots for selected date"
              ) : "Please select a date to see available times"}
            </h5>
            
            {date && (
              <div className="grid grid-cols-3 gap-3">
                {availableTimeSlots.map((slot) => (
                  <button
                    key={`${slot.time}-${slot.availabilityId}`}
                    className={`time-slot border py-3 px-4 rounded-md transition-colors font-medium text-sm ${
                      time === slot.time 
                        ? "border-primary bg-primary text-white shadow-md" 
                        : "border-gray-300 bg-white text-gray-700 hover:border-primary hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => handleTimeSelect(slot.time, slot.availabilityId)}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{formatTime(slot.time)}</div>
                      <div className="text-xs opacity-75">({slot.spotsLeft} spots)</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!date || !time || !availabilityId || isLoading}
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
