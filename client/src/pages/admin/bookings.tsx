import React, { useState } from "react";
import { useLocation } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/AdminLayout";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "lucide-react";

export default function BookingsCalendar() {
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTourId, setSelectedTourId] = useState<string>("all");
  const [showBookedOnly, setShowBookedOnly] = useState<boolean>(false);

  // Fetch bookings
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['/api/bookings'],
    select: (data) => {
      const allBookings = data as any[];
      if (selectedTourId && selectedTourId !== "all") {
        return allBookings.filter(booking => booking.tourId.toString() === selectedTourId);
      }
      return allBookings;
    },
  });

  // Fetch tours for filter
  const { data: tours, isLoading: isLoadingTours } = useQuery({
    queryKey: ['/api/tours'],
    select: (data) => data as any[],
  });

  // Fetch availabilities
  const { data: availabilities } = useQuery({
    queryKey: ['/api/availabilities'],
    select: (data) => {
      const allAvailabilities = data as any[];
      if (selectedTourId && selectedTourId !== "all") {
        return allAvailabilities.filter(avail => avail.tourId.toString() === selectedTourId);
      }
      return allAvailabilities;
    },
  });

  // Get days in current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Get previous month
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  // Get next month
  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Get bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    if (!bookings) return [];
    
    const dayStr = format(day, 'yyyy-MM-dd');
    return bookings.filter((booking: any) => {
      const availability = availabilities?.find((a: any) => a.id === booking.availabilityId);
      return availability && availability.date === dayStr;
    });
  };

  // Get availabilities for a specific day
  const getAvailabilitiesForDay = (day: Date) => {
    if (!availabilities) return [];
    
    const dayStr = format(day, 'yyyy-MM-dd');
    return availabilities.filter((a: any) => a.date === dayStr);
  };

  // Get tour by ID
  const getTourById = (id: number) => {
    return tours?.find((tour: any) => tour.id === id);
  };

  // Get availability by ID
  const getAvailabilityById = (id: number) => {
    return availabilities?.find((a: any) => a.id === id);
  };

  if (isLoadingTours || isLoadingBookings) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Booking Calendar">
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Booking Calendar</h1>
            <p className="text-gray-500">View and manage bookings</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedTourId} onValueChange={setSelectedTourId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by tour" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Tours</SelectLabel>
                  <SelectItem value="all">All Tours</SelectItem>
                  {tours?.map((tour: any) => (
                    <SelectItem key={tour.id} value={tour.id.toString()}>
                      {tour.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="show-booked-only"
            checked={showBookedOnly}
            onCheckedChange={setShowBookedOnly}
          />
          <Label htmlFor="show-booked-only">
            Show only days with bookings
          </Label>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())}>
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-medium py-2">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before the start of month */}
              {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                <div key={`empty-start-${i}`} className="p-1 min-h-[100px]"></div>
              ))}
              
              {/* Days of the month */}
              {daysInMonth.map((day) => {
                const dayBookings = getBookingsForDay(day);
                const dayAvailabilities = getAvailabilitiesForDay(day);
                const hasDayBookings = dayBookings.length > 0;
                
                // Skip this day if we're only showing booked days and there are no bookings
                if (showBookedOnly && !hasDayBookings) {
                  return (
                    <div
                      key={day.toString()}
                      className="p-1 min-h-[100px] opacity-30 bg-gray-50"
                    >
                      <div className="text-right p-1 text-sm font-medium text-gray-400">
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div
                    key={day.toString()}
                    className={`p-1 border rounded-md min-h-[100px] ${
                      isToday(day) 
                        ? 'bg-primary/10 border-primary' 
                        : !isSameMonth(day, currentDate) 
                          ? 'bg-gray-100 text-gray-400' 
                          : hasDayBookings
                            ? 'bg-green-50 border-green-200'
                            : ''
                    }`}
                  >
                    <div className="text-right p-1 text-sm font-medium">
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {!showBookedOnly && dayAvailabilities.map((availability: any) => (
                        <div 
                          key={availability.id} 
                          className="text-xs px-1 py-0.5 bg-gray-100 rounded"
                        >
                          {availability.time} ({availability.spotsLeft}/{availability.maxSpots} spots)
                        </div>
                      ))}
                      
                      {dayBookings.map((booking: any) => (
                        <Dialog key={booking.id}>
                          <DialogTrigger asChild>
                            <div 
                              className="text-xs px-1 py-0.5 bg-primary/20 hover:bg-primary/30 rounded cursor-pointer"
                            >
                              {booking.customerLastName}, {booking.numberOfParticipants} ppl
                            </div>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                              <DialogDescription>
                                Booking reference: {booking.bookingReference}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <h3 className="font-medium">Tour Information</h3>
                                <p className="text-sm text-gray-500">
                                  {getTourById(booking.tourId)?.name} - {getAvailabilityById(booking.availabilityId)?.date} at {getAvailabilityById(booking.availabilityId)?.time}
                                </p>
                              </div>
                              <div>
                                <h3 className="font-medium">Customer Information</h3>
                                <p className="text-sm">
                                  {booking.customerFirstName} {booking.customerLastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {booking.customerEmail} | {booking.customerPhone}
                                </p>
                              </div>
                              <div>
                                <h3 className="font-medium">Booking Details</h3>
                                <p className="text-sm">
                                  Participants: {booking.numberOfParticipants}
                                </p>
                                <p className="text-sm">
                                  Total Amount: €{(booking.totalAmount / 100).toFixed(2)}
                                </p>
                                <p className="text-sm">
                                  Payment Status: <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'outline'}>{booking.paymentStatus}</Badge>
                                </p>
                              </div>
                              {booking.specialRequests && (
                                <div>
                                  <h3 className="font-medium">Special Requests</h3>
                                  <p className="text-sm text-gray-500">
                                    {booking.specialRequests}
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Empty cells for days after the end of month */}
              {Array.from({
                length: 6 - endOfMonth(currentDate).getDay()
              }).map((_, i) => (
                <div key={`empty-end-${i}`} className="p-1 min-h-[100px]"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}