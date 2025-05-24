import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTourSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Badge } from "lucide-react";

// Extended schema for our form with proper validation
const createTourSchema = insertTourSchema.extend({
  // Override price to accept decimal format like 45.00
  price: z.string().min(1, "Price is required").refine(
    (val) => {
      // Check if it's a valid decimal number
      return /^\d+(\.\d{1,2})?$/.test(val);
    },
    { message: "Price must be a valid number (e.g. 45.00)" }
  ),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

// Badge color options with preview
const badgeColors = [
  { value: "bg-red-500 text-white", label: "Red", preview: "bg-red-500" },
  { value: "bg-blue-500 text-white", label: "Blue", preview: "bg-blue-500" },
  { value: "bg-green-500 text-white", label: "Green", preview: "bg-green-500" },
  { value: "bg-yellow-500 text-black", label: "Yellow", preview: "bg-yellow-500" },
  { value: "bg-purple-500 text-white", label: "Purple", preview: "bg-purple-500" },
];

export default function CreateTourPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Form definition with validation
  const form = useForm<z.infer<typeof createTourSchema>>({
    resolver: zodResolver(createTourSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      duration: "",
      maxGroupSize: 10,
      difficulty: "medium",
      price: "",
      badge: "",
      badgeColor: "",
      isActive: true,
    },
  });

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit handler
  const onSubmit = async (data: z.infer<typeof createTourSchema>) => {
    try {
      setIsSubmitting(true);

      // First, upload the image if there is one
      let imageUrl = data.imageUrl;
      
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        
        const uploadResponse = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }
        
        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.imageUrl;
      }
      
      // Convert price to cents for storage
      const priceInCents = Math.round(parseFloat(data.price) * 100);
      
      // Create tour with the processed data
      const response = await apiRequest("POST", "/api/tours", {
        ...data,
        imageUrl,
        price: priceInCents,
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Tour created successfully",
        });
        navigate("/admin/tours");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create tour");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tour",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Create New Tour">
      <Card className="p-6 max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Tour Name */}
                <FormField
                  control={form.control}
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

                {/* Tour Duration */}
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

                {/* Group Size */}
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
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Difficulty */}
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

                {/* Price */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (€)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="45.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <FormLabel>Tour Image</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="tour-image"
                    />
                    <label
                      htmlFor="tour-image"
                      className="cursor-pointer block text-center"
                    >
                      {imagePreview ? (
                        <div className="space-y-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-40 mx-auto object-contain"
                          />
                          <p className="text-sm text-blue-500">Change image</p>
                        </div>
                      ) : (
                        <div className="py-4">
                          <p className="text-gray-500">
                            Click to upload an image
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            JPG, PNG or GIF, max 5MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Or enter an image URL:
                  </p>
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Badge */}
                <FormField
                  control={form.control}
                  name="badge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Badge Text (Optional)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Badge className="h-5 w-5" />
                          <Input
                            placeholder="Popular"
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Badge Color */}
                <FormField
                  control={form.control}
                  name="badgeColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Badge Color</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {badgeColors.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center">
                                <div 
                                  className={`w-4 h-4 rounded-full mr-2 ${color.preview}`} 
                                />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is Active */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 border rounded-md">
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="m-0">
                        Active (will be shown on website)
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Description - Rich Text Editor */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tour Description</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/tours")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Tour"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </AdminLayout>
  );
}