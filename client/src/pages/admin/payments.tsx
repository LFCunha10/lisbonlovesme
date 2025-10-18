import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CreditCard,
  DollarSign,
  Filter,
  Search,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { getLocalizedText } from "@/lib/tour-utils";

export default function AdminPaymentsPage() {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [refundReason, setRefundReason] = useState("");

  // Fetch all bookings with payment info
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['/api/admin/payments'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/payments");
      return response.json();
    }
  });

  // Process refund mutation
  const refundMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: number, reason: string }) => {
      return apiRequest("POST", `/api/admin/refund/${bookingId}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
      setIsRefundDialogOpen(false);
      setSelectedBooking(null);
      setRefundReason("");
      toast({
        title: "Refund Processed",
        description: "The refund has been processed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process refund. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleRefund = (booking: any) => {
    setSelectedBooking(booking);
    setIsRefundDialogOpen(true);
  };

  const processRefund = () => {
    if (!selectedBooking) return;
    refundMutation.mutate({ 
      bookingId: selectedBooking.id, 
      reason: refundReason 
    });
  };

  // Filter bookings based on search term and status filter
  const filteredBookings = bookings?.filter((booking: any) => {
    const name = typeof booking.customerName === 'string' ? booking.customerName.toLowerCase() : '';
    const email = typeof booking.customerEmail === 'string' ? booking.customerEmail.toLowerCase() : '';
    const reference = typeof booking.bookingReference === 'string' ? booking.bookingReference.toLowerCase() : '';
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      name.includes(search) ||
      email.includes(search) ||
      reference.includes(search);

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && booking.paymentStatus === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Payment Management">
        <div className="container mx-auto py-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>
                View and manage all payments and process refunds if needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Payment Management">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-2xl font-bold">Payment Management</CardTitle>
              <CardDescription>
                View and manage all payments and process refunds if needed.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email or reference..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredBookings?.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
                <p className="text-muted-foreground">
                  No payments match your current filters.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Tour</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings?.map((booking: any) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          {format(new Date(booking.createdAt || new Date()), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{booking.customerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.customerEmail}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                            {booking.bookingReference}
                          </code>
                        </TableCell>
                        <TableCell>
                          {getLocalizedText(booking.tourName, i18n.language) || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(booking.totalAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {booking.participants} {booking.participants === 1 ? 'person' : 'people'}
                          </div>
                          {booking.additionalInfo?.pricing?.discount && (
                            <div className="text-xs text-muted-foreground">
                              Discount{booking.additionalInfo.pricing.discount.code ? ` (${booking.additionalInfo.pricing.discount.code})` : ''}: -{formatCurrency(booking.additionalInfo.pricing.discount.appliedAmount || 0)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking.paymentStatus)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefund(booking)}
                            disabled={booking.paymentStatus !== 'paid'}
                            className="w-full"
                          >
                            {booking.paymentStatus === 'paid' ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refund
                              </>
                            ) : (
                              <span>No Action</span>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              You are about to process a refund for the booking made by {selectedBooking?.customerName}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Customer:</span>
                <span className="font-medium">{selectedBooking?.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tour:</span>
                <span className="font-medium">{selectedBooking ? getLocalizedText(selectedBooking.tourName, i18n.language) : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {selectedBooking?.date} at {selectedBooking?.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount to refund:</span>
                <span className="font-medium text-primary">
                  {selectedBooking ? formatCurrency(selectedBooking.totalAmount) : ''}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for refund
              </label>
              <Input
                id="reason"
                placeholder="Customer requested cancellation..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRefundDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={processRefund}
              disabled={!refundReason || refundMutation.isPending}
            >
              {refundMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Process Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
