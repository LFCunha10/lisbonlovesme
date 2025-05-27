import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminLayout from "@/components/admin/AdminLayout";
// Drag and drop functionality will be added later

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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, TrashIcon, GripVerticalIcon, ImageIcon } from "lucide-react";

const gallerySchema = z.object({
  imageUrl: z.string().min(1, { message: "Please provide an image URL" }),
  title: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

type GalleryFormValues = z.infer<typeof gallerySchema>;

export default function AdminGallery() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // Fetch gallery images
  const { data: galleryImages, isLoading } = useQuery({
    queryKey: ['/api/gallery'],
    select: (data) => data as any[],
  });

  // Form for creating gallery images
  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      imageUrl: "",
      title: "",
      description: "",
      isActive: true
    }
  });

  // Mutations
  const createGalleryMutation = useMutation({
    mutationFn: async (data: GalleryFormValues) => {
      return apiRequest("POST", "/api/gallery", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Image Added",
        description: "The gallery image has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add gallery image. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/gallery/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      toast({
        title: "Image Deleted",
        description: "The gallery image has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete gallery image. Please try again.",
        variant: "destructive",
      });
    }
  });

  const reorderMutation = useMutation({
    mutationFn: async (imageIds: number[]) => {
      return apiRequest("POST", "/api/gallery/reorder", { imageIds });
    },
    onSuccess: () => {
      toast({
        title: "Images Reordered",
        description: "Gallery images have been reordered successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reorder images. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: GalleryFormValues) => {
    createGalleryMutation.mutate(data);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      deleteGalleryMutation.mutate(id);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append('image', files[0]);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Upload result:', result); // Debug log
      form.setValue('imageUrl', result.url || result.imageUrl || result.path);
      
      toast({
        title: "Image Uploaded",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0 || !galleryImages) return;
    const items = Array.from(galleryImages);
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    queryClient.setQueryData(['/api/gallery'], items);
    const imageIds = items.map((item: any) => item.id);
    reorderMutation.mutate(imageIds);
  };

  const handleMoveDown = (index: number) => {
    if (!galleryImages || index === galleryImages.length - 1) return;
    const items = Array.from(galleryImages);
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    queryClient.setQueryData(['/api/gallery'], items);
    const imageIds = items.map((item: any) => item.id);
    reorderMutation.mutate(imageIds);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Gallery Management">
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gallery Management</h1>
            <p className="text-gray-500">Manage photos for "Discover Lisbon Through Our Lens"</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Photo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Gallery Photo</DialogTitle>
                <DialogDescription>
                  Add a new photo to your gallery. You can upload an image or provide a URL.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      <p className="text-xs text-gray-500 mt-1">Or provide a URL below</p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://example.com/image.jpg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Beautiful Lisbon view..." />
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
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Description of the photo..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createGalleryMutation.isPending}>
                      {createGalleryMutation.isPending ? "Adding..." : "Add Photo"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Gallery Photos ({galleryImages?.length || 0})
            </CardTitle>
            <CardDescription>
              Drag and drop photos to reorder them. Photos will appear in this order on your website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!galleryImages || galleryImages.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
                <p className="text-gray-500 mb-4">Add your first photo to get started with your gallery.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add First Photo
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {galleryImages.map((image: any, index: number) => (
                  <div
                    key={image.id}
                    className="relative group bg-white rounded-lg border shadow-sm overflow-hidden"
                  >
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-8 w-8 p-0 bg-white/80"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === galleryImages.length - 1}
                        className="h-8 w-8 p-0 bg-white/80"
                      >
                        ↓
                      </Button>
                    </div>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(image.id)}
                        className="h-8 w-8 p-0"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <img
                      src={image.imageUrl}
                      alt={image.title || "Gallery image"}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                      }}
                    />
                    
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {image.title && (
                            <h4 className="font-medium text-sm truncate">{image.title}</h4>
                          )}
                          {image.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{image.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Position: {index + 1}</p>
                        </div>
                        <Badge variant={image.isActive ? "default" : "secondary"} className="text-xs">
                          {image.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}