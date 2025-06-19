import React, { useState } from "react";
import { useLocation } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from "date-fns";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
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
  const [showCloseDayDialog, setShowCloseDayDialog] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState<string>("");

  // Fetch bookings
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
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
  const { data: tours = [], isLoading: isLoadingTours } = useQuery({
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
    onSuccess: (data: any) => {
      if (data) {
        setAutoCloseDay(data.autoCloseDay);
      }
    },
  });
  
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
      setSelectedDay(null);
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

  // Helper functions
  const getBookingsForDay = (day: Date) => {
    if (!bookings || !bookings.length) return [];
    
    const dayStr = format(day, 'yyyy-MM-dd');
    return bookings.filter((booking: any) => {
      const availability = availabilities?.find((a: any) => a.id === booking.availabilityId);
      return availability && availability.date === dayStr;
    });
  };

  const getAvailabilitiesForDay = (day: Date) => {
    if (!availabilities || !availabilities.length) return [];
    
    const dayStr = format(day, 'yyyy-MM-dd');
    return availabilities.filter((a: any) => a.date === dayStr);
  };

  const getTourById = (id: number) => {
    return tours?.find((tour: any) => tour.id === id);
  };

  const getAvailabilityById = (id: number) => {
    return availabilities?.find((a: any) => a.id === id);
  };
  
  const isDayClosed = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return closedDays.some((closedDay: any) => closedDay.date === dayStr);
  };
  
  const getClosedDayInfo = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return closedDays.find((closedDay: any) => closedDay.date === dayStr);
  };
  
  const handleAutoCloseChange = (checked: boolean) => {
    setAutoCloseDay(checked);
    updateAdminSettings.mutate({ autoCloseDay: checked });
  };
  
  const handleShowCloseDay = (day: Date) => {
    setSelectedDay(format(day, 'yyyy-MM-dd'));
    setShowCloseDayDialog(true);
  };
  
  const handleCloseDay = () => {
    if (selectedDay) {
      markDayAsClosed.mutate({
        date: selectedDay,
        reason: closeReason || 'Manually closed'
      });
    }
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
                      {getLocalizedText(tour.name, i18n.language)}
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

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-booked-only"
              checked={showBookedOnly}
              onCheckedChange={setShowBookedOnly}
            />
            <Label htmlFor="show-booked-only">
              Show only days with bookings
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-close-day"
              checked={autoCloseDay}
              onCheckedChange={handleAutoCloseChange}
            />
            <Label htmlFor="auto-close-day">
              Automatically close days when tours are booked
            </Label>
          </div>
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
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayBookings = getBookingsForDay(day);
                const dayAvailabilities = getAvailabilitiesForDay(day);
                const hasDayBookings = dayBookings.length > 0;
                const isClosed = isDayClosed(day);
                const closedDayInfo = isClosed ? getClosedDayInfo(day) : null;
                
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
                              <p>{closedDayInfo?.reason || 'Day marked as closed'}</p>
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
                          onClick={() => removeClosure.mutate(dayStr)}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {!isClosed && !showBookedOnly && dayAvailabilities.map((availability: any) => (
                        <div 
                          key={availability.id} 
                          className="text-xs px-1 py-0.5 bg-gray-100 rounded"
                        >
                          {availability.time} ({availability.spotsLeft}/{availability.maxSpots} spots)
                        </div>
                      ))}
                      
                      {!isClosed && dayBookings.map((booking: any) => (
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

      {/* Dialog for closing days */}
      <Dialog open={showCloseDayDialog} onOpenChange={setShowCloseDayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Day as Closed</DialogTitle>
            <DialogDescription>
              {selectedDay && `This will mark ${selectedDay} as closed. No tours will be available on this day.`}
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
              setSelectedDay(null);
              setCloseReason('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleCloseDay}>
              Mark as Closed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}