import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function GalleryPage() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<any>(null);

  // Fetch gallery images
  const { data: galleryImages, isLoading } = useQuery({
    queryKey: ['/api/gallery'],
    select: (data) => data as any[],
  });

  const activeImages = galleryImages?.filter(img => img.isActive) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Discover Lisbon Through Our Lens
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explore the beauty and charm of Lisbon through our curated collection of photographs. 
              Each image captures the essence of what makes our tours special and memorable.
            </p>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="container mx-auto px-4 py-12">
        {activeImages.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-gray-900 mb-2">No photos yet</h3>
            <p className="text-gray-500">Our gallery will be updated soon with beautiful Lisbon photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {activeImages.map((image, index) => (
              <Dialog key={image.id}>
                <DialogTrigger asChild>
                  <div className="group cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={image.imageUrl}
                        alt={image.title || image.description || `Lisbon photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://via.placeholder.com/400x400?text=Image+Not+Found";
                        }}
                      />
                    </div>
                    
                    {(image.title || image.description) && (
                      <div className="p-4">
                        {image.title && (
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                            {image.title}
                          </h3>
                        )}
                        {image.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {image.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </DialogTrigger>
                
                <DialogContent className="max-w-4xl w-full p-0">
                  <div className="relative">
                    <img
                      src={image.imageUrl}
                      alt={image.title || image.description || `Lisbon photo ${index + 1}`}
                      className="w-full h-auto max-h-[80vh] object-contain"
                    />
                    
                    {(image.title || image.description) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                        {image.title && (
                          <h3 className="font-semibold text-white text-xl mb-2">
                            {image.title}
                          </h3>
                        )}
                        {image.description && (
                          <p className="text-white/90">
                            {image.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience Lisbon?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join us on one of our guided tours and discover these amazing places in person. 
            Create your own memories in the beautiful city of Lisbon.
          </p>
          <Link href="/tours">
            <Button size="lg" className="px-8">
              View Our Tours
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}