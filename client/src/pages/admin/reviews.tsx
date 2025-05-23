import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, EyeIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { useTranslation } from "react-i18next";

export default function AdminReviews() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  // Fetch reviews including unapproved ones
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['/api/testimonials', { includeUnapproved: true }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/testimonials?includeUnapproved=true");
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  // Fetch tours for display names
  const { data: tours } = useQuery({
    queryKey: ['/api/tours'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/tours");
      if (!res.ok) throw new Error("Failed to fetch tours");
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

  // Helper to get tour name
  const getTourName = (tourId: number) => {
    const tour = tours?.find((t: any) => t.id === tourId);
    return tour ? tour.name : "Unknown Tour";
  };

  // View review details
  const handleViewReview = (review: any) => {
    setSelectedReview(review);
    setIsDetailsOpen(true);
  };

  // Approve a review
  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={i < rating ? "text-yellow-400" : "text-gray-300"}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout title={t('admin.reviews')}>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">{t('admin.reviews')}</h1>
        
        <Tabs defaultValue="pending" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending Reviews
              {pendingReviews.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {pendingReviews.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Reviews</CardTitle>
                <CardDescription>
                  Reviews waiting for your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <span className="loading loading-spinner"></span>
                  </div>
                ) : pendingReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-gray-500">No pending reviews</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Tour</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReviews.map((review: any) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">
                            {review.customerName}
                            <div className="text-xs text-gray-500">
                              {review.customerCountry}
                            </div>
                          </TableCell>
                          <TableCell>{getTourName(review.tourId)}</TableCell>
                          <TableCell>{renderStars(review.rating)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {review.text}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewReview(review)}
                              >
                                <EyeIcon className="mr-1 h-4 w-4" />
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedReviews.map((review: any) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">
                            {review.customerName}
                            <div className="text-xs text-gray-500">
                              {review.customerCountry}
                            </div>
                          </TableCell>
                          <TableCell>{getTourName(review.tourId)}</TableCell>
                          <TableCell>{renderStars(review.rating)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {review.text}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReview(review)}
                            >
                              <EyeIcon className="mr-1 h-4 w-4" />
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