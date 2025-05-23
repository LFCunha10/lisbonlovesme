import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { Booking } from "@shared/schema";

// Store for managing the booking modal state
interface BookingModalStore {
  isOpen: boolean;
  selectedTour: number | null;
  openBookingModal: (tourId?: number) => void;
  closeBookingModal: () => void;
}

export const useBookingModal = create<BookingModalStore>((set) => ({
  isOpen: false,
  selectedTour: null,
  openBookingModal: (tourId = null) => set({ isOpen: true, selectedTour: tourId }),
  closeBookingModal: () => set({ isOpen: false })
}));

// Hook for fetching bookings
export function useBookings(tourId?: number) {
  const queryParams = tourId ? `?tourId=${tourId}` : "";
  
  const {
    data = [],
    isLoading,
    error,
  } = useQuery<Booking[]>({
    queryKey: [`/api/bookings${queryParams}`],
  });

  return { bookings: data, isLoading, error };
}

export function useBooking(reference?: string) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<Booking>({
    queryKey: [`/api/bookings/reference/${reference}`],
    enabled: !!reference,
  });

  return { booking: data, isLoading, error };
}

// Store for managing booking state within the modal
interface BookingFormStore {
  currentStep: number;
  bookingData: any;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateBookingData: (data: any) => void;
  resetBookingData: () => void;
}

export const useBookingForm = create<BookingFormStore>((set) => ({
  currentStep: 1,
  bookingData: {
    tourId: null,
    availabilityId: null,
    date: "",
    time: "",
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: "",
    numberOfParticipants: 2,
    specialRequests: "",
    totalAmount: 0,
  },
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: state.currentStep - 1 })),
  updateBookingData: (data) => set((state) => ({ 
    bookingData: { ...state.bookingData, ...data } 
  })),
  resetBookingData: () => set({
    currentStep: 1,
    bookingData: {
      tourId: null,
      availabilityId: null,
      date: "",
      time: "",
      customerFirstName: "",
      customerLastName: "",
      customerEmail: "",
      customerPhone: "",
      numberOfParticipants: 2,
      specialRequests: "",
      totalAmount: 0,
    }
  })
}));
