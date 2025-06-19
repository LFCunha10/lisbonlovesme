import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTours } from "@/hooks/use-tours";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { getLocalizedText } from "@/lib/tour-utils";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Search, Calendar, User, Mail, Phone, CheckCircle, XCircle } from "lucide-react";

export default function ViewBookings() {
  const { i18n } = useTranslation();
  const { tours } = useTours();
  const [filterTourId, setFilterTourId] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  // Use query to fetch bookings directly instead of useBookings hook
  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ["/api/admin/bookings", filterTourId],
    queryFn: async () => {
      const url = filterTourId ? `/api/admin/bookings?tourId=${filterTourId}` : "/api/admin/bookings";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    }
  });
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Filter bookings based on search query
  const filteredBookings = searchQuery
    ? bookings.filter(
        (booking) =>
          booking.bookingReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${booking.customerFirstName} ${booking.customerLastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          booking.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookings;

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success">Paid</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTourName = (tourId: number) => {
    const tour = tours.find((t) => t.id === tourId);
    return tour ? getLocalizedText(tour.name, i18n.language) : "Unknown Tour";
  };

  const handleSendReminder = async (bookingId: number) => {
    try {
      // API call to send a reminder email
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/reminder`, {});
      
      if (!response.ok) {
        throw new Error("Failed to send reminder");
      }
      
      toast({
        title: "Reminder Sent",
        description: "A reminder email has been sent to the customer",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">View Bookings</h2>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <Label htmlFor="search" className="mb-2 block">
            Search Bookings
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-dark/50" />
            <Input
              id="search"
              placeholder="Search by reference, name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <Label htmlFor="tourFilter" className="mb-2 block">
            Filter by Tour
          </Label>
          <Select 
            value={filterTourId?.toString() || ""} 
            onValueChange={(value) => {
              setFilterTourId(value ? parseInt(value) : undefined);
            }}
          >
            <SelectTrigger id="tourFilter">
              <SelectValue placeholder="All Tours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tours</SelectItem>
              {tours.map((tour) => (
                <SelectItem key={tour.id} value={tour.id.toString()}>
                  {getLocalizedText(tour.name, i18n.language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div>Loading bookings...</div>
      ) : error ? (
        <div>Error loading bookings: {error.message}</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-8 bg-neutral-light/30 rounded-md">
          <p className="text-lg text-neutral-dark/70">No bookings found</p>
          <p className="text-sm text-neutral-dark/50">
            {searchQuery ? "Try adjusting your search" : "No bookings have been made yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardHeader className="pb-2 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center">
                    {booking.bookingReference}
                    <span className="ml-2">{getStatusBadge(booking.paymentStatus)}</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(booking)}>
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <span>
                      {formatDate(booking.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-dark/70">Tour:</span>{" "}
                    {getTourName(booking.tourId)}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    <span>
                      {booking.customerFirstName} {booking.customerLastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-dark/70">Participants:</span>{" "}
                    {booking.numberOfParticipants}
                  </div>
                  <div className="col-span-2">
                    <span className="text-neutral-dark/70">Total:</span>{" "}
                    {formatCurrency(booking.totalAmount)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {selectedBooking.bookingReference}
                </h3>
                {getStatusBadge(selectedBooking.paymentStatus)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-neutral-dark/70">Tour</Label>
                  <p className="font-medium">{getTourName(selectedBooking.tourId)}</p>
                </div>
                
                <div>
                  <Label className="text-neutral-dark/70">Date</Label>
                  <p className="font-medium">
                    {selectedBooking.date ? formatDate(selectedBooking.date) : "N/A"}
                  </p>
                </div>
                
                <div>
                  <Label className="text-neutral-dark/70">Time</Label>
                  <p className="font-medium">
                    {selectedBooking.time ? formatTime(selectedBooking.time) : "N/A"}
                  </p>
                </div>
                
                <div className="col-span-2">
                  <Label className="text-neutral-dark/70">Customer Information</Label>
                  <div className="space-y-1 mt-1">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-primary" />
                      <span>
                        {selectedBooking.customerFirstName} {selectedBooking.customerLastName}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-primary" />
                      <span>{selectedBooking.customerEmail}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-primary" />
                      <span>{selectedBooking.customerPhone}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-neutral-dark/70">Number of Participants</Label>
                  <p className="font-medium">{selectedBooking.numberOfParticipants}</p>
                </div>
                
                <div>
                  <Label className="text-neutral-dark/70">Total Amount</Label>
                  <p className="font-medium">{formatCurrency(selectedBooking.totalAmount)}</p>
                </div>
                
                {selectedBooking.specialRequests && (
                  <div className="col-span-2">
                    <Label className="text-neutral-dark/70">Special Requests</Label>
                    <p className="mt-1">{selectedBooking.specialRequests}</p>
                  </div>
                )}
                
                <div className="col-span-2">
                  <Label className="text-neutral-dark/70">Booking Status</Label>
                  <div className="flex items-center mt-1">
                    {selectedBooking.paymentStatus === "paid" ? (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2 text-success" />
                        <span>Payment completed</span>
                      </>
                    ) : selectedBooking.paymentStatus === "pending" ? (
                      <>
                        <Badge variant="outline" className="mr-2">Pending</Badge>
                        <span>Payment is pending</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 mr-2 text-destructive" />
                        <span>Payment {selectedBooking.paymentStatus}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="col-span-2">
                  <Label className="text-neutral-dark/70">Payment Information</Label>
                  <p className="mt-1">
                    {selectedBooking.stripePaymentIntentId 
                      ? `Stripe Payment ID: ${selectedBooking.stripePaymentIntentId}`
                      : "No payment information available"}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Label className="text-neutral-dark/70 mb-2 block">Actions</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleSendReminder(selectedBooking.id)}
                    disabled={selectedBooking.remindersSent}
                  >
                    Send Reminder
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
