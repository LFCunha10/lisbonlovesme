import { useQuery } from "@tanstack/react-query";
import { Tour, Availability, Testimonial } from "@shared/schema";

export function useTours() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery<Tour[]>({
    queryKey: ["/api/tours"],
  });

  return { tours: data, isLoading, error };
}

export function useTour(id?: number) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<Tour>({
    queryKey: [`/api/tours/${id}`],
    enabled: !!id,
  });

  return { tour: data, isLoading, error };
}

export function useAvailabilities(tourId?: number) {
  const queryParams = tourId ? `?tourId=${tourId}` : "";
  
  const {
    data = [],
    isLoading,
    error,
  } = useQuery<Availability[]>({
    queryKey: [`/api/availabilities${queryParams}`],
  });

  return { availabilities: data, isLoading, error };
}

export function useTestimonials(tourId?: number) {
  const queryParams = tourId ? `?tourId=${tourId}` : "";
  
  const {
    data = [],
    isLoading,
    error,
  } = useQuery<Testimonial[]>({
    queryKey: [`/api/testimonials${queryParams}`],
  });

  return { testimonials: data, isLoading, error };
}

export function useAvailabilityByDate(tourId: number, date?: string) {
  const { availabilities, isLoading, error } = useAvailabilities(tourId);
  
  let filteredAvailabilities: Availability[] = [];
  
  if (date && !isLoading && !error) {
    filteredAvailabilities = availabilities.filter(a => a.date === date && a.spotsLeft > 0);
  }
  
  return {
    availabilities: filteredAvailabilities,
    isLoading,
    error,
  };
}
