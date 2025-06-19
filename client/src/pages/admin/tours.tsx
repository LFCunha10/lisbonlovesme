import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminLayout from "@/components/admin/AdminLayout";
import { marked } from 'marked';

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { PlusIcon, PencilIcon, TrashIcon, InfoIcon, AlertTriangleIcon } from "lucide-react";

const tourSchema = z.object({
  name: z.string().min(3, { message: "Tour name must be at least 3 characters long" }),
  shortDescription: z.string().max(150, { message: "Short description must be less than 150 characters" }).optional(),
  description: z.string().min(10, { message: "Description must be at least 10 characters long" }),
  imageUrl: z.string().url({ message: "Please enter a valid URL for the image" }),
  duration: z.string().min(2, { message: "Please enter a valid duration" }),
  maxGroupSize: z.coerce.number().min(1, { message: "Group size must be at least 1" }),
  difficulty: z.string().min(2, { message: "Please enter a valid difficulty level" }),
  price: z.coerce.number().min(100, { message: "Price must be at least €1" }),
  badge: z.string().nullable().optional(),
  badgeColor: z.string().nullable().optional(),
  isActive: z.boolean().default(true)
});

type TourFormValues = z.infer<typeof tourSchema>;

const availabilitySchema = z.object({
  tourId: z.coerce.number(),
  selectedDates: z.array(z.date()).min(1, { message: "Please select at least one date" }),
  time: z.string().min(5, { message: "Please enter a valid time" }),
  maxSpots: z.coerce.number().min(1, { message: "Max spots must be at least 1" }),
  spotsLeft: z.coerce.number().min(0, { message: "Spots left must be 0 or more" }),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

export default function AdminTours() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateTourOpen, setIsCreateTourOpen] = useState(false);
  const [isCreateAvailabilityOpen, setIsCreateAvailabilityOpen] = useState(false);
  const [isEditTourOpen, setIsEditTourOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("tours");

  // Fetch tours
  const { data: tours, isLoading: isLoadingTours } = useQuery({
    queryKey: ['/api/tours'],
    select: (data) => data as any[],
  });

  const selectedTour = selectedTourId ? tours?.find((tour: any) => tour.id === selectedTourId) : null;
  // Fetch availabilities for selected tour
  const { data: availabilities, isLoading: isLoadingAvailabilities } = useQuery({
    queryKey: ['/api/availabilities', selectedTourId],
    queryFn: () => fetch(`/api/availabilities/${selectedTourId}`).then(res => res.json()),
    enabled: !!selectedTourId && selectedTab === "availabilities",
  });

  // Selected tour data

  

  // Form for creating/editing tours
  const tourForm = useForm<TourFormValues>({
    resolver: zodResolver(tourSchema),
    defaultValues: selectedTour || {
      name: "",
      description: "",
      imageUrl: "",
      duration: "",
      maxGroupSize: 10,
      difficulty: "Moderate",
      price: 4500,
      badge: "",
      badgeColor: "",
      isActive: true
    }
  });

  // Form for creating availabilities
  const availabilityForm = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      tourId: selectedTourId || 0,
      selectedDates: [],
      time: "09:00",
      maxSpots: 10,
      spotsLeft: 10
    }
  });

  // Update form values when selected tour changes
  React.useEffect(() => {
    if (selectedTour && isEditTourOpen) {
      // Convert price to cents for editing (stored in cents in DB)
      const formData = {
        ...selectedTour,
      };
      
      Object.keys(formData).forEach(key => {
        tourForm.setValue(key as any, formData[key as keyof typeof formData]);
      });
    }
  }, [selectedTour, isEditTourOpen, tourForm]);

  // Update availability form when selected tour changes
  React.useEffect(() => {
    if (selectedTourId) {
      availabilityForm.setValue('tourId', selectedTourId);
    }
  }, [selectedTourId, availabilityForm]);

  // Mutations
  const createTourMutation = useMutation({
    mutationFn: async (data: TourFormValues) => {
      return apiRequest("POST", "/api/tours", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      setIsCreateTourOpen(false);
      tourForm.reset();
      toast({
        title: "Tour Created",
        description: "The tour has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create tour. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateTourMutation = useMutation({
    mutationFn: async (data: TourFormValues & { id: number }) => {
      const { id, ...tourData } = data;
      return apiRequest("PUT", `/api/tours/${id}`, tourData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      setIsEditTourOpen(false);
      toast({
        title: "Tour Updated",
        description: "The tour has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update tour. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteTourMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/tours/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      setIsDeleteDialogOpen(false);
      setSelectedTourId(null);
      toast({
        title: "Tour Deleted",
        description: "The tour has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete tour. Please try again.",
        variant: "destructive",
      });
    }
  });

  const createAvailabilityMutation = useMutation({
    mutationFn: async (data: AvailabilityFormValues) => {
      // Create availability for each selected date
      const promises = data.selectedDates.map(date => {
        // Use local date format to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        
        const availabilityData = {
          tourId: data.tourId,
          date: localDateStr,
          time: data.time,
          maxSpots: data.maxSpots,
          spotsLeft: data.spotsLeft
        };
        return apiRequest("POST", "/api/availabilities", availabilityData);
      });
      
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['/api/availabilities', selectedTourId] });
      setIsCreateAvailabilityOpen(false);
      availabilityForm.reset({ 
        tourId: selectedTourId || 0,
        selectedDates: [],
        time: "09:00",
        maxSpots: 10,
        spotsLeft: 10
      });
      toast({
        title: "Availabilities Created",
        description: `Successfully created ${results.length} availability slot${results.length !== 1 ? 's' : ''}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create availability. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onCreateTourSubmit = (data: TourFormValues) => {
    createTourMutation.mutate(data);
  };

  const onUpdateTourSubmit = (data: TourFormValues) => {
    if (!selectedTourId) return;
    updateTourMutation.mutate({ ...data, id: selectedTourId });
  };

  const onCreateAvailabilitySubmit = (data: AvailabilityFormValues) => {
    createAvailabilityMutation.mutate(data);
  };

  const handleDeleteTour = () => {
    if (!selectedTourId) return;
    deleteTourMutation.mutate(selectedTourId);
  };

  const handleTourSelect = (tour: any) => {
    setSelectedTourId(tour.id);
    setSelectedTab("details");
  };

  if (isLoadingTours) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Tour Management">
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Tour Management</h1>
            <p className="text-gray-500">Create, edit, and manage tours</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => navigate("/admin/tours/create")}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add New Tour
            </Button>
            
            {/* Keep the dialog for backward compatibility but hidden */}
            <Dialog open={isCreateTourOpen} onOpenChange={setIsCreateTourOpen}>
              <DialogTrigger asChild>
                <span className="hidden">Old Tour Form</span>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Tour</DialogTitle>
                  <DialogDescription>
                    Fill out the form below to create a new tour.
                  </DialogDescription>
                </DialogHeader>
                <Form {...tourForm}>
                  <form onSubmit={tourForm.handleSubmit(onCreateTourSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={tourForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tour Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Historic Belém Tour" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={tourForm.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="A brief description that will appear on tour cards (max 150 characters)" 
                              rows={2} 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                          <div className="text-xs text-gray-500 mt-1">
                            {field.value?.length || 0}/150 characters
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={tourForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Explore the historic Belém district..." rows={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={tourForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={tourForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl>
                              <Input placeholder="3 hours" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={tourForm.control}
                        name="maxGroupSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Group Size</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={tourForm.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <FormControl>
                              <Input placeholder="Easy, Moderate, Challenging" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={tourForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (in cents)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500">Example: 4500 for €45.00</p>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={tourForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                            <div className="space-y-0.5">
                              <FormLabel>Active</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={tourForm.control}
                        name="badge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Badge (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Most Popular, Evening Tour, etc." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={tourForm.control}
                        name="badgeColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Badge Color (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="primary, secondary, accent" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createTourMutation.isPending}>
                        {createTourMutation.isPending ? "Creating..." : "Create Tour"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Tours</CardTitle>
              <CardDescription>
                Select a tour to manage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tours?.map((tour: any) => (
                  <div
                    key={tour.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors hover:bg-primary/10 flex justify-between items-center ${selectedTourId === tour.id ? 'bg-primary/10 border-l-4 border-primary' : ''}`}
                    onClick={() => handleTourSelect(tour)}
                  >
                    <div>
                      <div className="font-medium">{tour.name}</div>
                      <div className="text-xs text-gray-500">{tour.duration} • €{(tour.price / 100).toFixed(2)}</div>
                    </div>
                    {!tour.isActive && (
                      <Badge variant="outline" className="ml-2">Inactive</Badge>
                    )}
                  </div>
                ))}

                {tours?.length === 0 && (
                  <div className="text-center p-4">
                    <p className="text-gray-500">No tours found</p>
                    <Button variant="outline" className="mt-2" onClick={() => setIsCreateTourOpen(true)}>
                      Create your first tour
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            {selectedTour ? (
              <>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>{selectedTour.name}</CardTitle>
                    <CardDescription>
                      {selectedTour.duration} • €{(selectedTour.price / 100).toFixed(2)}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/admin/tours/edit/${selectedTour.id}`)}>
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    
                    {/* Keep dialog hidden for backward compatibility */}
                    <Dialog open={isEditTourOpen} onOpenChange={setIsEditTourOpen}>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto hidden">
                        <DialogHeader>
                          <DialogTitle>Edit Tour</DialogTitle>
                          <DialogDescription>
                            Make changes to the tour information.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...tourForm}>
                          <form onSubmit={tourForm.handleSubmit(onUpdateTourSubmit)} className="space-y-4 py-4">
                            <FormField
                              control={tourForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tour Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Historic Belém Tour" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={tourForm.control}
                              name="shortDescription"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Short Description</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="A brief description that will appear on tour cards (max 150 characters)" 
                                      rows={2} 
                                      {...field} 
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  <div className="text-xs text-gray-500 mt-1">
                                    {field.value?.length || 0}/150 characters
                                  </div>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={tourForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Description</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Explore the historic Belém district..." rows={4} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={tourForm.control}
                                name="imageUrl"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Image URL</FormLabel>
                                    <FormControl>
                                      <Input placeholder="https://example.com/image.jpg" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={tourForm.control}
                                name="duration"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Duration</FormLabel>
                                    <FormControl>
                                      <Input placeholder="3 hours" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={tourForm.control}
                                name="maxGroupSize"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Max Group Size</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} 
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={tourForm.control}
                                name="difficulty"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Difficulty</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Easy, Moderate, Challenging" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={tourForm.control}
                                name="price"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Price (in cents)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        {...field} 
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                    <p className="text-xs text-gray-500">Example: 4500 for €45.00</p>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={tourForm.control}
                                name="isActive"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                                    <div className="space-y-0.5">
                                      <FormLabel>Active</FormLabel>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={tourForm.control}
                                name="badge"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Badge (optional)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Most Popular, Evening Tour, etc." {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={tourForm.control}
                                name="badgeColor"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Badge Color (optional)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="primary, secondary, accent" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <DialogFooter>
                              <Button type="submit" disabled={updateTourMutation.isPending}>
                                {updateTourMutation.isPending ? "Saving..." : "Save Changes"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Tour</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this tour? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Alert>
                            <AlertTriangleIcon className="h-4 w-4" />
                            <AlertDescription>
                              Deleting this tour will also remove all associated availabilities and may affect bookings.
                            </AlertDescription>
                          </Alert>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteTour} disabled={deleteTourMutation.isPending}>
                            {deleteTourMutation.isPending ? "Deleting..." : "Delete Tour"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="availabilities">Availabilities</TabsTrigger>
                      <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium">Description</h3>
                          <div 
                            className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked.parse(selectedTour.description) }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-medium">Duration</h3>
                            <p className="text-sm text-gray-600 mt-1">{selectedTour.duration}</p>
                          </div>
                          <div>
                            <h3 className="font-medium">Max Group Size</h3>
                            <p className="text-sm text-gray-600 mt-1">{selectedTour.maxGroupSize} participants</p>
                          </div>
                          <div>
                            <h3 className="font-medium">Difficulty</h3>
                            <p className="text-sm text-gray-600 mt-1">{selectedTour.difficulty}</p>
                          </div>
                          <div>
                            <h3 className="font-medium">Price</h3>
                            <p className="text-sm text-gray-600 mt-1">€{(selectedTour.price / 100).toFixed(2)}</p>
                          </div>
                        </div>

                        {selectedTour.imageUrl && (
                          <div>
                            <h3 className="font-medium">Image</h3>
                            <div className="mt-2 relative rounded-md overflow-hidden aspect-video">
                              <img 
                                src={selectedTour.imageUrl} 
                                alt={selectedTour.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="availabilities">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Availabilities</h3>
                          <Dialog open={isCreateAvailabilityOpen} onOpenChange={setIsCreateAvailabilityOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add Availability
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Availability</DialogTitle>
                                <DialogDescription>
                                  Select multiple dates and set the time and capacity for this tour.
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...availabilityForm}>
                                <form onSubmit={availabilityForm.handleSubmit(onCreateAvailabilitySubmit)} className="space-y-4 py-4">
                                  <FormField
                                    control={availabilityForm.control}
                                    name="selectedDates"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Select Dates</FormLabel>
                                        <FormControl>
                                          <div className="border rounded-md p-2 max-w-sm mx-auto">
                                            <Calendar
                                              mode="multiple"
                                              selected={field.value || []}
                                              onSelect={field.onChange}
                                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                              className="w-full"
                                            />
                                            <div className="mt-2 text-xs text-gray-600 text-center">
                                              {field.value?.length > 0 ? (
                                                <span>
                                                  {field.value.length} date{field.value.length !== 1 ? 's' : ''} selected
                                                </span>
                                              ) : (
                                                <span>Click dates to select multiple days</span>
                                              )}
                                            </div>
                                          </div>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={availabilityForm.control}
                                    name="time"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Time</FormLabel>
                                        <FormControl>
                                          <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={availabilityForm.control}
                                      name="maxSpots"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Max Spots</FormLabel>
                                          <FormControl>
                                            <Input 
                                              type="number"
                                              {...field}
                                              onChange={(e) => {
                                                field.onChange(parseInt(e.target.value));
                                                // Also update spotsLeft to match maxSpots when initially setting
                                                availabilityForm.setValue('spotsLeft', parseInt(e.target.value));
                                              }}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={availabilityForm.control}
                                      name="spotsLeft"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Spots Left</FormLabel>
                                          <FormControl>
                                            <Input 
                                              type="number"
                                              {...field}
                                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button type="submit" disabled={createAvailabilityMutation.isPending}>
                                      {createAvailabilityMutation.isPending ? "Adding..." : "Add Availability"}
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {isLoadingAvailabilities ? (
                          <div className="flex justify-center py-4">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Array.isArray(availabilities) && availabilities.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                                    No availabilities found. Add some to make this tour bookable.
                                  </TableCell>
                                </TableRow>
                              )}
                              {Array.isArray(availabilities) && availabilities.map((availability: any) => (
                                <TableRow key={availability.id}>
                                  <TableCell>{availability.date}</TableCell>
                                  <TableCell>{availability.time}</TableCell>
                                  <TableCell>{availability.spotsLeft}/{availability.maxSpots} available</TableCell>
                                  <TableCell>
                                    {availability.spotsLeft === 0 ? (
                                      <Badge variant="destructive">Sold Out</Badge>
                                    ) : availability.spotsLeft < 3 ? (
                                      <Badge variant="outline">Limited</Badge>
                                    ) : (
                                      <Badge variant="default">Available</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="bookings">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Bookings</h3>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/bookings?tourId=${selectedTourId}`)}
                          >
                            View in Calendar
                          </Button>
                        </div>
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center space-y-3">
                            <InfoIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div>
                              <h3 className="font-medium">Bookings are shown in the Calendar View</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                Visit the Booking Calendar to see all bookings for this tour.
                              </p>
                            </div>
                            <Button 
                              variant="default"
                              onClick={() => navigate(`/admin/bookings?tourId=${selectedTourId}`)}
                            >
                              Go to Calendar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-3">
                  <InfoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="font-medium">Select a tour</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    Select a tour from the list to view and manage its details, or create a new tour to get started.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}