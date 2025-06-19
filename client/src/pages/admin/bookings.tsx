import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, parseISO } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, XIcon, MinusIcon } from "lucide-react";
import { getLocalizedText } from "@/lib/tour-utils";
import { useTranslation } from "react-i18next";

export default function BookingsCalendar() {
  const { i18n } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTourId, setSelectedTourId] = useState<string>("all");
  const [showBookedOnly, setShowBookedOnly] = useState<boolean>(false);
  const [autoCloseDay, setAutoCloseDay] = useState<boolean>(false);
  const [selectedDayForClosing, setSelectedDayForClosing] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState<string>("");
  const [showCloseDayDialog, setShowCloseDayDialog] = useState<boolean>(false);

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
  const { data: availabilities = [] } = useQuery({
    queryKey: ['/api/availabilities'],
    select: (data) => {
      const allAvailabilities = data as any[];
      if (selectedTourId && selectedTourId !== "all") {
        return allAvailabilities.filter(avail => avail.tourId.toString() === selectedTourId);
      }
      return allAvailabilities;
    },
  });

  // Fetch closed days
  const { data: closedDays = [] } = useQuery({
    queryKey: ['/api/closed-days'],
    select: (data) => data as any[],
  });

  // Fetch admin settings
  const { data: adminSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    select: (data) => data as any,
  });

  // Update autoCloseDay when adminSettings change
  useEffect(() => {
    if (adminSettings && adminSettings.autoCloseDay !== undefined) {
      setAutoCloseDay(adminSettings.autoCloseDay);
    }
  }, [adminSettings]);

  // Mutation to mark a day as closed
  const markDayAsClosed = useMutation({
    mutationFn: (data: { date: string, reason: string }) => 
      apiRequest('POST', '/api/closed-days', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/closed-days'] });
      toast({
        title: "Day marked as closed",
        description: "The selected day has been marked as closed",
      });
      setSelectedDayForClosing(null);
      setCloseReason("");
      setShowCloseDayDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to mark day as closed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Mutation to remove a closed day
  const removeClosure = useMutation({
    mutationFn: (date: string) => 
      apiRequest('DELETE', `/api/closed-days/${date}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/closed-days'] });
      toast({
        title: "Closure removed",
        description: "The day is now available",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove closure",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Mutation to update admin settings
  const updateAdminSettings = useMutation({
    mutationFn: (settings: { autoCloseDay: boolean }) => 
      apiRequest('PUT', '/api/admin/settings', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Settings updated",
        description: "Auto-close setting has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Get tour by ID
  const getTourById = (id: number) => {
    return tours?.find((tour: any) => tour.id === id);
  };

  // Get bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return bookings?.filter((booking: any) => {
      const bookingDate = getAvailabilityById(booking.availabilityId)?.date;
      return bookingDate === dayStr;
    }) || [];
  };

  // Get availabilities for a specific day
  const getAvailabilitiesForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return availabilities?.filter((availability: any) => availability.date === dayStr) || [];
  };

  // Get availability by ID
  const getAvailabilityById = (id: number) => {
    return availabilities?.find((a: any) => a.id === id);
  };

  // Check if a day has bookings
  const hasBookings = (day: Date) => {
    return getBookingsForDay(day).length > 0;
  };

  // Check if a day is closed
  const isDayClosed = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return closedDays.some((closedDay: any) => closedDay.date === dayStr);
  };

  // Get closed day info
  const getClosedDayInfo = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return closedDays.find((closedDay: any) => closedDay.date === dayStr);
  };

  // Handle auto-close day setting change
  const handleAutoCloseChange = (checked: boolean) => {
    setAutoCloseDay(checked);
    updateAdminSettings.mutate({ autoCloseDay: checked });
  };

  // Handle marking a day as closed
  const handleMarkDayClosed = () => {
    if (selectedDayForClosing) {
      markDayAsClosed.mutate({
        date: selectedDayForClosing,
        reason: closeReason || 'Manually closed'
      });
    }
  };

  // Handle showing close day dialog
  const handleShowCloseDay = (day: Date) => {
    setSelectedDayForClosing(format(day, 'yyyy-MM-dd'));
    setShowCloseDayDialog(true);
  };

  if (isLoadingTours || isLoadingBookings) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Generate days for the calendar
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  // Calculate the start of the week for the first day of the month
  const startDayOfWeek = start.getDay();
  const daysInMonth = [
    // Empty cells for days before the start of month
    ...Array.from({ length: startDayOfWeek }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() - (startDayOfWeek - i));
      return day;
    }),
    // Days of the current month
    ...days
  ];

  return (
    <AdminLayout title="Booking Calendar">
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Booking Calendar</h1>
            <p className="text-gray-500">View and manage bookings</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Select value={selectedTourId} onValueChange={setSelectedTourId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by tour" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tours</SelectItem>
                {tours?.map((tour: any) => (
                  <SelectItem key={tour.id} value={tour.id.toString()}>
                    {getLocalizedText(tour.name, i18n.language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-booked-only"
                checked={showBookedOnly}
                onCheckedChange={setShowBookedOnly}
              />
              <Label htmlFor="show-booked-only">Booked only</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-close-day"
                checked={autoCloseDay}
                onCheckedChange={handleAutoCloseChange}
              />
              <Label htmlFor="auto-close-day">Auto-close day</Label>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(new Date())}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Color Legend */}
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                <span>Available Slots</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-200 border border-yellow-300 rounded"></div>
                <span>Pending Bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
                <span>Confirmed Bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-200 border border-red-300 rounded"></div>
                <span>Cancelled/Failed</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Weekday headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center font-medium text-gray-700 bg-gray-50">
                  {day}
                </div>
              ))}
              
              {/* Days of the month */}
              {daysInMonth.map((day) => {
                const dayBookings = getBookingsForDay(day);
                const dayAvailabilities = getAvailabilitiesForDay(day);
                const hasDayBookings = dayBookings.length > 0;
                const isClosed = isDayClosed(day);
                
                // Debug logging
                const dayStr = format(day, 'yyyy-MM-dd');
                if (dayBookings.length > 0) {
                  console.log(`Day ${dayStr} has ${dayBookings.length} bookings:`, dayBookings.map(b => ({
                    id: b.id,
                    status: b.paymentStatus,
                    name: b.customerLastName
                  })));
                }
                
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
                          : isClosed
                            ? 'bg-red-50 border-red-200'
                            : hasDayBookings
                              ? 'bg-green-50 border-green-200'
                              : ''
                    }`}
                  >
                    <div className="flex justify-between items-center p-1">
                      <div className="text-sm font-medium">
                        {format(day, 'd')}
                      </div>
                      {isClosed && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="destructive" className="text-xs">Closed</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getClosedDayInfo(day)?.reason || 'Day marked as closed'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {isSameMonth(day, currentDate) && !isClosed && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full hover:bg-red-100"
                          onClick={() => handleShowCloseDay(day)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      )}
                      {isSameMonth(day, currentDate) && isClosed && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full hover:bg-green-100"
                          onClick={() => removeClosure.mutate(format(day, 'yyyy-MM-dd'))}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {/* Available slots - clickable, showing tour name and availability */}
                      {!isClosed && !showBookedOnly && dayAvailabilities.map((availability: any) => {
                        const tour = getTourById(availability.tourId);
                        const isFullyBooked = availability.spotsLeft === 0;
                        
                        return (
                          <Dialog key={availability.id}>
                            <DialogTrigger asChild>
                              <div 
                                className={`text-xs px-1 py-0.5 rounded cursor-pointer transition-colors ${
                                  isFullyBooked 
                                    ? 'bg-gray-200 text-gray-500' 
                                    : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                }`}
                              >
                                {availability.time} ({availability.spotsLeft}/{availability.maxSpots} spots)
                              </div>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Available Tour Slot</DialogTitle>
                                <DialogDescription>
                                  {getAvailabilityById(availability.id)?.date} at {availability.time}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <h3 className="font-medium">Tour Information</h3>
                                  <p className="text-sm text-gray-700">
                                    {tour ? getLocalizedText(tour.name, i18n.language) : 'Unknown Tour'}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="font-medium">Availability</h3>
                                  <p className="text-sm text-gray-500">
                                    {availability.spotsLeft} spots left out of {availability.maxSpots}
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        );
                      })}
                      
                      {/* Confirmed Bookings */}
                      {!isClosed && dayBookings
                        .filter((booking: any) => booking.paymentStatus === 'paid' || booking.paymentStatus === 'confirmed')
                        .map((booking: any) => (
                          <Dialog key={booking.id}>
                            <DialogTrigger asChild>
                              <div 
                                className="text-xs px-1 py-0.5 rounded cursor-pointer transition-colors bg-green-200 hover:bg-green-300 text-green-800"
                              >
                                ✓ {booking.customerLastName}, {booking.numberOfParticipants} ppl
                              </div>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirmed Booking</DialogTitle>
                                <DialogDescription>
                                  Booking reference: {booking.bookingReference}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <h3 className="font-medium">Tour Information</h3>
                                  <p className="text-sm text-gray-700">
                                    {getTourById(booking.tourId) ? getLocalizedText(getTourById(booking.tourId)?.name, i18n.language) : 'Unknown Tour'} 
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {getAvailabilityById(booking.availabilityId)?.date} at {getAvailabilityById(booking.availabilityId)?.time}
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
                                    Payment Status: <Badge variant="default">Confirmed</Badge>
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

                      {/* Pending Bookings */}
                      {!isClosed && dayBookings
                        .filter((booking: any) => booking.paymentStatus === 'pending' || booking.paymentStatus === 'requires_payment_method')
                        .map((booking: any) => (
                          <Dialog key={booking.id}>
                            <DialogTrigger asChild>
                              <div 
                                className="text-xs px-1 py-0.5 rounded cursor-pointer transition-colors bg-yellow-200 hover:bg-yellow-300 text-yellow-800"
                              >
                                ⏳ {booking.customerLastName}, {booking.numberOfParticipants} ppl
                              </div>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Pending Booking</DialogTitle>
                                <DialogDescription>
                                  Booking reference: {booking.bookingReference}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <h3 className="font-medium">Tour Information</h3>
                                  <p className="text-sm text-gray-700">
                                    {getTourById(booking.tourId) ? getLocalizedText(getTourById(booking.tourId)?.name, i18n.language) : 'Unknown Tour'} 
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {getAvailabilityById(booking.availabilityId)?.date} at {getAvailabilityById(booking.availabilityId)?.time}
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
                                    Payment Status: <Badge variant="secondary">Pending</Badge>
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

                      {/* Failed/Cancelled Bookings */}
                      {!isClosed && dayBookings
                        .filter((booking: any) => 
                          booking.paymentStatus !== 'paid' && 
                          booking.paymentStatus !== 'confirmed' && 
                          booking.paymentStatus !== 'pending' && 
                          booking.paymentStatus !== 'requires_payment_method'
                        )
                        .map((booking: any) => (
                          <Dialog key={booking.id}>
                            <DialogTrigger asChild>
                              <div 
                                className="text-xs px-1 py-0.5 rounded cursor-pointer transition-colors bg-red-200 hover:bg-red-300 text-red-800"
                              >
                                ✗ {booking.customerLastName}, {booking.numberOfParticipants} ppl
                              </div>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Failed/Cancelled Booking</DialogTitle>
                                <DialogDescription>
                                  Booking reference: {booking.bookingReference}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <h3 className="font-medium">Tour Information</h3>
                                  <p className="text-sm text-gray-700">
                                    {getTourById(booking.tourId) ? getLocalizedText(getTourById(booking.tourId)?.name, i18n.language) : 'Unknown Tour'} 
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {getAvailabilityById(booking.availabilityId)?.date} at {getAvailabilityById(booking.availabilityId)?.time}
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
                                    Payment Status: <Badge variant="destructive">{booking.paymentStatus}</Badge>
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

      {/* Dialog for closing days */}
      <Dialog open={showCloseDayDialog} onOpenChange={setShowCloseDayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Day as Closed</DialogTitle>
            <DialogDescription>
              {selectedDayForClosing && `This will mark ${selectedDayForClosing} as closed. No tours will be available on this day.`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="close-reason" className="mb-2 block">Reason (optional)</Label>
            <Textarea 
              id="close-reason" 
              placeholder="Enter reason for closure"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCloseDayDialog(false);
              setSelectedDayForClosing(null);
              setCloseReason('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleMarkDayClosed}>
              Mark as Closed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}