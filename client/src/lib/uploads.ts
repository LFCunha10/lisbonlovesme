import { apiRequest } from "@/lib/queryClient";

type UploadImageResponse = {
  imageUrl?: string;
  url?: string;
  path?: string;
};

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiRequest("POST", "/api/upload-image", formData);
  const data = (await response.json()) as UploadImageResponse;
  const imageUrl = data.imageUrl ?? data.url ?? data.path;

  if (!imageUrl) {
    throw new Error("Upload response missing image URL");
  }

  return imageUrl;
}
