import { useState, useEffect } from "react";
import { Availability } from "@shared/schema";

// This hook processes availabilities to determine which days should be disabled
// in the calendar UI

export function useCalendar(availabilities?: Availability[]) {
  const [disabledDays, setDisabledDays] = useState<number[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    if (!availabilities || availabilities.length === 0) {
      setDisabledDays([]);
      setAvailableDates([]);
      return;
    }

    // Extract all unique dates that have availabilities with spots left
    const dates = availabilities
      .filter(a => a.spotsLeft > 0)
      .map(a => a.date);
    
    const uniqueDates = Array.from(new Set(dates));
    setAvailableDates(uniqueDates);

    // Find which days of the week have no availabilities
    const dayMap = new Set<number>();
    
    uniqueDates.forEach(dateStr => {
      const date = new Date(dateStr);
      dayMap.add(date.getDay());
    });

    // Create an array of days that should be disabled (0-6, where 0 is Sunday)
    const disabledDayNumbers: number[] = [];
    for (let i = 0; i < 7; i++) {
      if (!dayMap.has(i)) {
        disabledDayNumbers.push(i);
      }
    }

    setDisabledDays(disabledDayNumbers);
  }, [availabilities]);

  return { disabledDays, availableDates };
}

// Hook to check if a specific date has availability
export function useIsDateAvailable(availabilities: Availability[], date?: Date) {
  const [isAvailable, setIsAvailable] = useState(false);
  
  useEffect(() => {
    if (!date || !availabilities || availabilities.length === 0) {
      setIsAvailable(false);
      return;
    }
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if there are any availabilities for this date with spots left
    const hasAvailability = availabilities.some(
      a => a.date === dateStr && a.spotsLeft > 0
    );
    
    setIsAvailable(hasAvailability);
  }, [availabilities, date]);
  
  return isAvailable;
}

// Hook to get all availabilities for a specific date
export function useAvailabilityForDate(availabilities: Availability[], date?: Date) {
  const [dateAvailabilities, setDateAvailabilities] = useState<Availability[]>([]);
  
  useEffect(() => {
    if (!date || !availabilities) {
      setDateAvailabilities([]);
      return;
    }
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Filter availabilities for this date with spots left
    const filtered = availabilities.filter(
      a => a.date === dateStr && a.spotsLeft > 0
    );
    
    // Sort by time
    filtered.sort((a, b) => a.time.localeCompare(b.time));
    
    setDateAvailabilities(filtered);
  }, [availabilities, date]);
  
  return dateAvailabilities;
}
