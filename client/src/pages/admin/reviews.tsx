import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedText } from "@/lib/tour-utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { Star, CheckCircle, XCircle, Mail, Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Badge,
} from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminReviews() {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Fetch all testimonials (including unapproved)
  const { data: allTestimonials, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['/api/testimonials', { approvedOnly: false }],
    queryFn: async () => {
      const response = await fetch('/api/testimonials?approvedOnly=false');
      return response.json();
    }
  });

  // Fetch all bookings for sending review emails
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/admin/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/bookings');
      return response.json();
    }
  });

  // Approve review mutation
  const approveReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      return apiRequest("PUT", `/api/testimonials/${reviewId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
      toast({
        title: "Review Approved",
        description: "The review is now visible on your website.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve review. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Send review email mutation
  const sendReviewEmailMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      return apiRequest("POST", `/api/send-review-email/${bookingId}`);
    },
    onSuccess: () => {
      toast({
        title: "Review Email Sent",
        description: "Customer will receive an email with a link to leave their review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send review email.",
        variant: "destructive",
      });
    }
  });

  const pendingReviews = allTestimonials?.filter((review: any) => !review.isApproved) || [];
  const approvedReviews = allTestimonials?.filter((review: any) => review.isApproved) || [];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (testimonialsLoading || bookingsLoading) {
    return (
      <AdminLayout title="Review Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Review Management">
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Reviews</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedReviews.length}</div>
              <p className="text-xs text-muted-foreground">Visible on website</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Can request reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>Reviews waiting for your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingReviews.map((review: any) => (
                  <div key={review.id} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        <p className="text-gray-700 mb-3">"{review.text}"</p>
                        <div className="text-sm text-gray-600">
                          <strong>{review.customerName}</strong> from {review.customerCountry}
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button
                          onClick={() => approveReviewMutation.mutate(review.id)}
                          disabled={approveReviewMutation.isPending}
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Published Reviews */}
        {approvedReviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Published Reviews</CardTitle>
              <CardDescription>Reviews currently showing on your website</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedReviews.map((review: any) => (
                  <div key={review.id} className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <Badge variant="default" className="bg-green-600">Published</Badge>
                    </div>
                    <p className="text-gray-700 mb-3">"{review.text}"</p>
                    <div className="text-sm text-gray-600">
                      <strong>{review.customerName}</strong> from {review.customerCountry}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Send Review Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Send Review Requests</CardTitle>
            <CardDescription>Send review request emails to customers who have completed tours</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings && bookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Tour</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.slice(0, 10).map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.customerFirstName} {booking.customerLastName}</div>
                          <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getLocalizedText(booking.tourName, i18n.language) || 'Tour'}</TableCell>
                      <TableCell>{new Date(booking.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={booking.paymentStatus === 'succeeded' ? 'default' : 'secondary'}>
                          {booking.paymentStatus || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendReviewEmailMutation.mutate(booking.id)}
                          disabled={sendReviewEmailMutation.isPending}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Send Review Email
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No bookings found to send review requests.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
