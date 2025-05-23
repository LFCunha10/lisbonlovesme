import React, { useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckIcon, StarIcon, ShieldCheckIcon } from "lucide-react";

export default function AdminTestimonials() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTestimonial, setSelectedTestimonial] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch testimonials including unapproved ones
  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['/api/testimonials', { includeUnapproved: true }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/testimonials?includeUnapproved=true");
      if (!res.ok) throw new Error("Failed to fetch testimonials");
      return res.json();
    },
  });

  // Approve testimonial mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PUT", `/api/testimonials/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
      toast({
        title: "Testimonial Approved",
        description: "The testimonial is now visible to customers.",
      });
      setIsDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve testimonial. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Get approved and pending testimonials
  const approvedTestimonials = testimonials?.filter((t: any) => t.isApproved) || [];
  const pendingTestimonials = testimonials?.filter((t: any) => !t.isApproved) || [];

  // Get tour name for a testimonial
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
    <>
      <Helmet>
        <title>Testimonial Management - Lisbonlovesme Admin</title>
      </Helmet>
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Testimonial Management</h1>
            <p className="text-gray-500">Review and approve customer testimonials</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending Approval
              {pendingTestimonials.length > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">{pendingTestimonials.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Testimonials</CardTitle>
                <CardDescription>
                  Review and approve testimonials from customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTestimonials.length === 0 ? (
                  <div className="text-center py-8">
                    <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending testimonials</h3>
                    <p className="mt-1 text-sm text-gray-500">All testimonials have been reviewed.</p>
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
                      {pendingTestimonials.map((testimonial: any) => (
                        <TableRow key={testimonial.id}>
                          <TableCell className="font-medium">
                            {testimonial.customerName}
                            <br />
                            <span className="text-xs text-gray-500">{testimonial.customerCountry}</span>
                          </TableCell>
                          <TableCell>{getTourName(testimonial.tourId)}</TableCell>
                          <TableCell>
                            <div className="flex">
                              {renderStars(testimonial.rating)}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{testimonial.text}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTestimonial(testimonial);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                View
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(testimonial.id)}
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
                <CardTitle>Approved Testimonials</CardTitle>
                <CardDescription>
                  Testimonials that are visible to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvedTestimonials.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-gray-500">No approved testimonials yet</span>
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
                      {approvedTestimonials.map((testimonial: any) => (
                        <TableRow key={testimonial.id}>
                          <TableCell className="font-medium">
                            {testimonial.customerName}
                            <br />
                            <span className="text-xs text-gray-500">{testimonial.customerCountry}</span>
                          </TableCell>
                          <TableCell>{getTourName(testimonial.tourId)}</TableCell>
                          <TableCell>
                            <div className="flex">
                              {renderStars(testimonial.rating)}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{testimonial.text}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTestimonial(testimonial);
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

        {/* Testimonial Detail Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Testimonial Details</DialogTitle>
              <DialogDescription>
                From {selectedTestimonial?.customerName} ({selectedTestimonial?.customerCountry})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-medium">Tour</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedTestimonial && getTourName(selectedTestimonial.tourId)}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Rating</h3>
                <div className="flex mt-1">
                  {selectedTestimonial && renderStars(selectedTestimonial.rating)}
                </div>
              </div>
              <div>
                <h3 className="font-medium">Testimonial</h3>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                  {selectedTestimonial?.text}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Status</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedTestimonial?.isApproved ? (
                    <Badge variant="default">Approved</Badge>
                  ) : (
                    <Badge variant="outline">Pending Approval</Badge>
                  )}
                </p>
              </div>
            </div>
            <DialogFooter>
              {selectedTestimonial && !selectedTestimonial.isApproved && (
                <Button 
                  onClick={() => handleApprove(selectedTestimonial.id)}
                  disabled={approveMutation.isPending}
                >
                  <CheckIcon className="mr-2 h-4 w-4" />
                  {approveMutation.isPending ? "Approving..." : "Approve Testimonial"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}