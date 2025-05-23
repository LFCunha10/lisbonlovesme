import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckIcon, StarIcon, ShieldCheckIcon } from "lucide-react";

export default function AdminReviews() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch reviews including unapproved ones
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['/api/testimonials', { includeUnapproved: true }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/testimonials?includeUnapproved=true");
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  // Approve review mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PUT", `/api/testimonials/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
      toast({
        title: "Review Approved",
        description: "The review is now visible to customers.",
      });
      setIsDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve review. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Get approved and pending reviews
  const approvedReviews = reviews?.filter((t: any) => t.isApproved) || [];
  const pendingReviews = reviews?.filter((t: any) => !t.isApproved) || [];

  // Get tour name for a review
  const { data: tours } = useQuery({
    queryKey: ['/api/tours'],
    select: (data) => data as any[],
  });
  
  const getTourName = (tourId: number) => {
    const tour = tours?.find((t: any) => t.id === tourId);
    return tour?.name || "Unknown Tour";
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Review Management">
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Review Management</h1>
            <p className="text-gray-500">Review and approve customer reviews</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending Approval
              {pendingReviews.length > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">{pendingReviews.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Reviews</CardTitle>
                <CardDescription>
                  Review and approve reviews from customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending reviews</h3>
                    <p className="mt-1 text-sm text-gray-500">All reviews have been reviewed.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Tour</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReviews.map((review: any) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">
                            {review.customerName}
                            <br />
                            <span className="text-xs text-gray-500">{review.customerCountry}</span>
                          </TableCell>
                          <TableCell>{getTourName(review.tourId)}</TableCell>
                          <TableCell>
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{review.text}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReview(review);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                View
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(review.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckIcon className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Reviews</CardTitle>
                <CardDescription>
                  Reviews that are visible to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvedReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-gray-500">No approved reviews yet</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Tour</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedReviews.map((review: any) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">
                            {review.customerName}
                            <br />
                            <span className="text-xs text-gray-500">{review.customerCountry}</span>
                          </TableCell>
                          <TableCell>{getTourName(review.tourId)}</TableCell>
                          <TableCell>
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{review.text}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReview(review);
                                setIsDetailsOpen(true);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Review Detail Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
              <DialogDescription>
                From {selectedReview?.customerName} ({selectedReview?.customerCountry})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-medium">Tour</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedReview && getTourName(selectedReview.tourId)}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Rating</h3>
                <div className="flex mt-1">
                  {selectedReview && renderStars(selectedReview.rating)}
                </div>
              </div>
              <div>
                <h3 className="font-medium">Review</h3>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                  {selectedReview?.text}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Status</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedReview?.isApproved ? (
                    <Badge variant="default">Approved</Badge>
                  ) : (
                    <Badge variant="outline">Pending Approval</Badge>
                  )}
                </p>
              </div>
            </div>
            <DialogFooter>
              {selectedReview && !selectedReview.isApproved && (
                <Button 
                  onClick={() => handleApprove(selectedReview.id)}
                  disabled={approveMutation.isPending}
                >
                  <CheckIcon className="mr-2 h-4 w-4" />
                  {approveMutation.isPending ? "Approving..." : "Approve Review"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}