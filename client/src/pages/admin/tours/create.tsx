import React, { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminLayout from "@/components/admin/AdminLayout";
import { default as RichTextEditor } from "@/components/admin/RichTextEditor";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ImageIcon, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Color options for badges
const colorOptions = [
  { value: "primary", label: "Blue", bgClass: "bg-primary" },
  { value: "secondary", label: "Purple", bgClass: "bg-secondary" },
  { value: "green", label: "Green", bgClass: "bg-green-500" },
  { value: "red", label: "Red", bgClass: "bg-red-500" },
  { value: "orange", label: "Orange", bgClass: "bg-orange-500" },
  { value: "yellow", label: "Yellow", bgClass: "bg-yellow-500" },
  { value: "teal", label: "Teal", bgClass: "bg-teal-500" },
  { value: "indigo", label: "Indigo", bgClass: "bg-indigo-500" },
  { value: "pink", label: "Pink", bgClass: "bg-pink-500" },
];

// Tour creation form schema
const tourSchema = z.object({
  name: z.string().min(2, { message: "Tour name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  imageUrl: z.string().optional(),
  duration: z.string().min(2, { message: "Duration is required (e.g., '2 hours')" }),
  maxGroupSize: z.coerce.number().min(1, { message: "Max group size must be at least 1" }),
  difficulty: z.string().min(1, { message: "Difficulty is required" }),
  price: z.string().min(1, { message: "Price is required" }),
  badge: z.string().optional().nullable(),
  badgeColor: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

type TourFormValues = z.infer<typeof tourSchema>;

export default function CreateTourPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<TourFormValues>({
    resolver: zodResolver(tourSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      duration: "",
      maxGroupSize: 10,
      difficulty: "medium",
      price: "",
      badge: "",
      badgeColor: "primary",
      isActive: true,
    },
  });

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image is too large. Maximum size is 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    // Upload the image
    setUploadingImage(true);
    
    const formData = new FormData();
    formData.append("image", file);
    
    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      const data = await response.json();
      form.setValue("imageUrl", data.imageUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Tour creation mutation
  const createTourMutation = useMutation({
    mutationFn: async (data: TourFormValues) => {
      return apiRequest("POST", "/api/tours", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      toast({
        title: "Success",
        description: "Tour created successfully",
      });
      navigate("/admin/tours");
    },
    onError: (error) => {
      console.error("Error creating tour:", error);
      toast({
        title: "Error",
        description: "Failed to create tour. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TourFormValues) => {
    // Convert price from decimal (45.00) to cents (4500)
    const formattedData = {
      ...data,
      price: parseFloat(data.price) * 100,
    };
    
    createTourMutation.mutate(formattedData as any);
  };

  return (
    <AdminLayout title="Create Tour">
      <div className="container mx-auto py-6">
        <Button 
          variant="outline" 
          onClick={() => navigate("/admin/tours")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tours
        </Button>
        
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Tour</CardTitle>
            <CardDescription>
              Fill out the form below to create a new tour for your agency.
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mx-6">
              <TabsTrigger value="details">Tour Details</TabsTrigger>
              <TabsTrigger value="media">Media & Appearance</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6 pt-6">
                  <TabsContent value="details" className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tour Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Historic Walking Tour" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <RichTextEditor
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Write a detailed description of the tour..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl>
                              <Input placeholder="2 hours" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="maxGroupSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Group Size</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                placeholder="10"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (€)</FormLabel>
                            <FormControl>
                              <Input 
                                type="text"
                                placeholder="45.00" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="media" className="space-y-6">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tour Image</FormLabel>
                          <div className="border rounded-md p-4">
                            {imagePreview ? (
                              <div className="mb-4">
                                <img 
                                  src={imagePreview} 
                                  alt="Tour preview" 
                                  className="max-h-60 rounded-md mx-auto"
                                />
                              </div>
                            ) : field.value ? (
                              <div className="mb-4">
                                <img 
                                  src={field.value} 
                                  alt="Tour" 
                                  className="max-h-60 rounded-md mx-auto"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-40 bg-gray-100 rounded-md mb-4">
                                <ImageIcon className="h-16 w-16 text-gray-400" />
                              </div>
                            )}
                            
                            <div className="flex items-center justify-center">
                              <Input
                                id="tour-image"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                              />
                              <label htmlFor="tour-image">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  disabled={uploadingImage}
                                  className="cursor-pointer"
                                  asChild
                                >
                                  <span>
                                    {uploadingImage ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : field.value ? (
                                      "Change Image"
                                    ) : (
                                      "Upload Image"
                                    )}
                                  </span>
                                </Button>
                              </label>
                            </div>
                            
                            <input 
                              type="hidden" 
                              {...field} 
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="badge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Badge Label (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Best Seller" 
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="badgeColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Badge Color</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={`w-full justify-start text-left font-normal ${
                                      !field.value && "text-muted-foreground"
                                    }`}
                                  >
                                    {field.value && (
                                      <div
                                        className={`h-4 w-4 rounded mr-2 ${
                                          colorOptions.find(c => c.value === field.value)?.bgClass || 'bg-primary'
                                        }`}
                                      />
                                    )}
                                    {colorOptions.find(c => c.value === field.value)?.label || "Select color"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-60 p-3">
                                <div className="grid grid-cols-3 gap-2">
                                  {colorOptions.map((color) => (
                                    <Button
                                      key={color.value}
                                      type="button"
                                      variant="outline"
                                      className={`h-8 w-full p-0 ${
                                        field.value === color.value && "border-2 border-primary"
                                      }`}
                                      onClick={() => field.onChange(color.value)}
                                    >
                                      <div className={`h-full w-full rounded ${color.bgClass}`} />
                                    </Button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <FormDescription>
                              Make this tour visible to customers
                            </FormDescription>
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
                  </TabsContent>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/admin/tours")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTourMutation.isPending}
                  >
                    {createTourMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Tour"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Tabs>
        </Card>
      </div>
    </AdminLayout>
  );
}