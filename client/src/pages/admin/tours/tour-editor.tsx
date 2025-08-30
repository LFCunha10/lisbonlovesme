import React, { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminLayout from "@/components/admin/AdminLayout";
//import { QuillEditor } from "@/components/admin/QuillEditor";

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
import { useTranslation } from "react-i18next";

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

// Tour form schema
const tourSchema = z.object({
  name: z.string().min(2, { message: "Tour name must be at least 2 characters" }),
  shortDescription: z.string().max(150, { message: "Short description must be less than 150 characters" }).optional(),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  imageUrl: z.string().optional(),
  duration: z.string().min(2, { message: "Duration is required (e.g., '2 hours')" }),
  maxGroupSize: z.coerce.number().min(1, { message: "Max group size must be at least 1" }),
  difficulty: z.string().min(1, { message: "Difficulty is required" }),
  price: z.string().min(1, { message: "Price is required" }),
  priceType: z.enum(["per_person", "per_group"], { message: "Price type is required" }),
  badge: z.string().optional().nullable(),
  badgeColor: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

type TourFormValues = z.infer<typeof tourSchema>;

export default function TourEditorPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined;
  const tourId = parseInt(id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("details");
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const form = useForm<TourFormValues>({
    resolver: zodResolver(tourSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      description: "",
      imageUrl: "",
      duration: "",
      maxGroupSize: 10,
      difficulty: "medium",
      price: "",
      priceType: "per_person" as const,
      badge: "",
      badgeColor: "primary",
      isActive: true,
    },
  });

  // Fetch tour data if in edit mode
  const { data: tour, isLoading } = useQuery({
    queryKey: ['/api/tours', tourId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tours/${tourId}`);
      return response.json();
    },
    enabled: isEditMode && !isNaN(tourId)
  });

  // Set form values when tour data is loaded in edit mode
  useEffect(() => {
    if (tour && isEditMode) {
      form.reset({
        name: tour.name,
        description: tour.description || "",
        imageUrl: tour.imageUrl || "",
        duration: tour.duration,
        maxGroupSize: tour.maxGroupSize,
        difficulty: tour.difficulty,
        price: (tour.price / 100).toFixed(2), // Convert cents to decimal
        priceType: tour.priceType || "per_person",
        badge: tour.badge || "",
        badgeColor: tour.badgeColor || "primary",
        isActive: tour.isActive !== false, // Default to true if not specified
      });

      if (tour.imageUrl) {
        setImagePreview(tour.imageUrl);
      }
    }
  }, [tour, form, isEditMode]);

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

  // Create tour mutation
  const createTourMutation = useMutation({
    mutationFn: async (data: TourFormValues) => {
      const formattedData = {
        ...data,
        price: parseFloat(data.price) * 100, // Convert price to cents
      };
      return apiRequest("POST", "/api/tours", formattedData);
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

  // Update tour mutation
  const updateTourMutation = useMutation({
    mutationFn: async (data: TourFormValues) => {
      const formattedData = {
        ...data,
        price: parseFloat(data.price) * 100, // Convert price to cents
      };
      return apiRequest("PUT", `/api/tours/${tourId}`, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      toast({
        title: "Success",
        description: "Tour updated successfully",
      });
      navigate("/admin/tours");
    },
    onError: (error) => {
      console.error("Error updating tour:", error);
      toast({
        title: "Error",
        description: "Failed to update tour. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TourFormValues) => {
    if (isEditMode) {
      updateTourMutation.mutate(data);
    } else {
      createTourMutation.mutate(data);
    }
  };

  const isPending = createTourMutation.isPending || updateTourMutation.isPending;

  if (isEditMode && isLoading) {
    return (
      <AdminLayout title={isEditMode ? t("admin.tours.editTour") : t("admin.tours.createTour")}>
        <div className="container mx-auto py-6 flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p>{t("admin.tours.loadingTour")}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditMode ? t("admin.tours.editTour") : t("admin.tours.createTour")}>
      <div className="container mx-auto py-6">
        <Button 
          variant="outline" 
          onClick={() => navigate("/admin/tours")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
        
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>
              {isEditMode ? t("admin.tours.editTour") : t("admin.tours.createTour")}
            </CardTitle>
            <CardDescription>
              {isEditMode 
                ? t("admin.tours.editTourDescription") 
                : t("admin.tours.createTourDescription")}
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mx-6 ml-0">
              <TabsTrigger value="details">{t("admin.tours.tourDetails")}</TabsTrigger>
              <TabsTrigger value="media">{t("admin.tours.mediaAppearance")}</TabsTrigger>
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
                          <FormLabel>{t("admin.tours.tourName")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("admin.tours.tourNamePlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Brief description for tour cards (max 150 characters)" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            This short description will appear on tour cards. {field.value?.length || 0}/150 characters.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.tours.description")}</FormLabel>
                          <FormControl>
                            {/* <QuillEditor
                              value={field.value}
                              onChange={field.onChange}
                              className="mb-6"
                            /> */}
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
                            <FormLabel>{t("admin.tours.duration")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("admin.tours.durationPlaceholder")} {...field} />
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
                            <FormLabel>{t("admin.tours.maxGroupSize")}</FormLabel>
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
                            <FormLabel>{t("admin.tours.difficulty")}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("admin.tours.selectDifficulty")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Easy">{t("admin.tours.difficultyEasy")}</SelectItem>
                                <SelectItem value="Medium">{t("admin.tours.difficultyMedium")}</SelectItem>
                                <SelectItem value="Hard">{t("admin.tours.difficultyHard")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="priceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pricing type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="per_person">Per Person</SelectItem>
                                <SelectItem value="per_group">Per Group</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.tours.price")} (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="text"
                              placeholder="45.00" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Price in Euros{form.watch("priceType") === "per_person" ? " per person" : " per group"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="media" className="space-y-6">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.tours.tourImage")}</FormLabel>
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
                              <div className="flex items-center justify-center h-40 bg-gray-100 rounded-md mb-4 dark:bg-gray-800">
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
                                        {t("admin.tours.uploading")}
                                      </>
                                    ) : field.value ? (
                                      t("admin.tours.changeImage")
                                    ) : (
                                      t("admin.tours.uploadImage")
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
                            <FormLabel>{t("admin.tours.badgeLabel")}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t("admin.tours.badgePlaceholder")} 
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
                            <FormLabel>{t("admin.tours.badgeColor")}</FormLabel>
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
                                    {colorOptions.find(c => c.value === field.value)?.label || t("admin.tours.selectColor")}
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
                            <FormLabel className="text-base">{t("admin.tours.activeStatus")}</FormLabel>
                            <FormDescription>
                              {t("admin.tours.activeStatusDescription")}
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
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditMode ? t("admin.tours.updating") : t("admin.tours.creating")}
                      </>
                    ) : (
                      isEditMode ? t("admin.tours.updateTour") : t("admin.tours.createTour")
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