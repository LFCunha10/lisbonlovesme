import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiJson, apiRequest } from "@/lib/queryClient";
import { uploadImage } from "@/lib/uploads";
import { ImageIcon, Loader2 } from "lucide-react";

export default function AdminHeroBannerPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: () => apiJson<{ heroBannerImageUrl?: string | null }>("/api/admin/settings"),
  });

  useEffect(() => {
    setImageUrl(settings?.heroBannerImageUrl || "");
  }, [settings?.heroBannerImageUrl]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", "/api/admin/settings", {
        heroBannerImageUrl: imageUrl || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Saved",
        description: "Homepage banner image updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not save homepage banner image.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image is too large. Maximum size is 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      const uploadedImageUrl = await uploadImage(file);
      setImageUrl(uploadedImageUrl);
      toast({
        title: "Image uploaded",
        description: "Click Save Changes to apply this image to the homepage banner.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <AdminLayout title="Homepage Banner">
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Homepage Banner Image</CardTitle>
            <CardDescription>
              Upload a new image for the top banner on the homepage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading settings...</div>
            ) : (
              <>
                <div className="border rounded-md p-4">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Homepage banner preview"
                      className="w-full max-h-[280px] object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-48 rounded-md bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Input
                    id="hero-banner-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  <label htmlFor="hero-banner-image-upload">
                    <Button type="button" variant="outline" disabled={uploadingImage} asChild>
                      <span className="cursor-pointer">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Upload Image"
                        )}
                      </span>
                    </Button>
                  </label>
                  <Button type="button" variant="ghost" onClick={() => setImageUrl("")}>
                    Remove Image
                  </Button>
                </div>

                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste image URL"
                />

                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
