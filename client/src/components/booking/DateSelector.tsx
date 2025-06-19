import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useCalendar } from "@/hooks/use-calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { isPastDate, formatTime } from "@/lib/utils";
import { Availability } from "@shared/schema";

interface DateSelectorProps {
  availabilities?: Availability[];
  isLoading?: boolean;
  error?: Error | null;
  onNext?: () => void;
  onCancel?: () => void;
  onSelect: (data: { date: string; time: string; availabilityId: number }) => void;
  selectedDate?: string;
  selectedTime?: string;
  selectedAvailabilityId?: number;
}

export default function DateSelector({
  availabilities = [],
  isLoading = false,
  error = null,
  onNext = () => {},
  onCancel = () => {},
  onSelect,
  selectedDate = "",
  selectedTime = "",
  selectedAvailabilityId = 0
}: DateSelectorProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  );
  const [time, setTime] = useState<string>(selectedTime);
  const [availabilityId, setAvailabilityId] = useState<number>(selectedAvailabilityId);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; availabilityId: number; spotsLeft: number }[]>([]);
  
  const { disabledDays } = useCalendar(availabilities);

  useEffect(() => {
    if (!date || !availabilities || availabilities.length === 0) {
      setAvailableTimeSlots([]);
      return;
    }

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
  }, [date, availabilities]);

  
  
  // Separate effect to handle time selection updates - only runs when availableTimeSlots change
  useEffect(() => {
    if (availableTimeSlots.length === 0) {
      if (time !== "" || availabilityId !== 0) {
        setTime("");
        setAvailabilityId(0);
      }
      return;
    }
    
    // Check if the current time selection is still valid
    const timeIsAvailable = availableTimeSlots.some(slot => slot.time === time);
    if (time && !timeIsAvailable) {
      setTime("");
      setAvailabilityId(0);
    }
  }, [availableTimeSlots]); // Only depend on availableTimeSlots to prevent infinite loop

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
      <h4 className="text-xl font-semibold mb-4">{t('booking.selectDateTime')}</h4>
      
      <div className="mb-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-error">
            <p>{t('booking.failedToLoadAvailability')}: {error.message}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              {t('booking.tryAgain')}
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
                <span>{t('booking.available')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-neutral-light/70 mr-2 rounded-sm"></div>
                <span>{t('booking.unavailable')}</span>
              </div>
            </div>
            
            <h5 className="font-semibold mb-2">
              {date ? (
                availableTimeSlots.length > 0 
                  ? t('booking.availableTimeSlots')
                  : t('booking.noAvailableTimeSlots')
              ) : t('booking.selectDateToSeeAvailableTimes')}
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
                      <div className="text-xs opacity-75">({slot.spotsLeft} {t('booking.spots')})</div>
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
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!date || !time || !availabilityId || isLoading}
        >
          {t('booking.nextStep')}
        </Button>
      </div>
    </div>
  );
}
