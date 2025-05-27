import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

export default function PhotoGallery() {
  const { t } = useTranslation();
  
  // Fetch gallery images from your admin-managed gallery
  const { data: galleryImages, isLoading } = useQuery({
    queryKey: ['/api/gallery'],
    select: (data) => data as any[],
  });

  // Use your uploaded gallery images, with fallback to ensure good display
  const images = galleryImages?.filter(img => img.isActive).map((img, index) => ({
    src: img.imageUrl,
    alt: img.title || img.description || `Lisbon gallery image ${index + 1}`,
    hideOnMobile: index >= 4, // Hide images after the 4th on mobile
    hideOnLgDown: index >= 6  // Hide images after the 6th on tablets
  })) || [];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{t('photoGallery.title')}</h2>
          <p className="text-lg text-neutral-dark/80 max-w-2xl mx-auto">
            {t('photoGallery.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <img
              key={index}
              src={image.src}
              alt={image.alt}
              className={`w-full h-64 object-cover rounded-lg shadow-md hover:opacity-90 transition-all cursor-pointer 
                ${image.hideOnMobile ? 'hidden md:block' : ''} 
                ${image.hideOnLgDown ? 'hidden lg:block' : ''}`}
            />
          ))}
        </div>
        
        <div className="text-center mt-8">
          <a href="#gallery" className="inline-flex items-center justify-center text-primary font-semibold hover:underline">
            {t('photoGallery.viewGallery')} <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
