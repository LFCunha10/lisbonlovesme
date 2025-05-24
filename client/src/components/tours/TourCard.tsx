import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Clock, Users, Activity } from "lucide-react";
import { Tour } from "@shared/schema";
import { cn, formatCurrency } from "@/lib/utils";
import { useBookingModal } from "@/hooks/use-bookings";
import { useTranslation } from "react-i18next";

interface TourCardProps {
  tour: Tour;
}

export default function TourCard({ tour }: TourCardProps) {
  const { openBookingModal } = useBookingModal();
  const { t } = useTranslation();

  const getBadgeColorClass = (color?: string) => {
    if (!color) return "bg-primary/10 text-primary";
    
    const colorMap: Record<string, string> = {
      primary: "bg-primary/10 text-primary",
      secondary: "bg-secondary/10 text-secondary",
      accent: "bg-accent/10 text-accent"
    };
    
    return colorMap[color] || colorMap.primary;
  };

  return (
    <div className="tour-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all">
      <Link href={`/tours/${tour.id}`}>
        <img 
          src={tour.imageUrl} 
          alt={tour.name} 
          className="w-full h-56 object-cover"
        />
      </Link>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-display font-bold">
            <Link href={`/tour/${tour.id}`}>{tour.name}</Link>
          </h3>
          {tour.badge && (
            <span className={cn("px-3 py-1 rounded-full text-sm font-semibold", getBadgeColorClass(tour.badgeColor))}>
              {tour.badge}
            </span>
          )}
        </div>
        
        <p className="text-neutral-dark/80 mb-4">
          {tour.shortDescription 
            ? tour.shortDescription 
            : (tour.description.length > 100 
                ? `${tour.description.substring(0, 100)}...` 
                : tour.description)}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-neutral-light px-3 py-1 rounded-full text-sm flex items-center">
            <Clock className="mr-1 h-4 w-4" /> {tour.duration} {t('tours.hours')}
          </span>
          <span className="bg-neutral-light px-3 py-1 rounded-full text-sm flex items-center">
            <Users className="mr-1 h-4 w-4" /> {t('tours.groupSize')}: {tour.maxGroupSize} {t('tours.people')}
          </span>
          <span className="bg-neutral-light px-3 py-1 rounded-full text-sm flex items-center">
            <Activity className="mr-1 h-4 w-4" /> {t(`tours.${tour.difficulty.toLowerCase()}`)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xl font-semibold text-neutral-dark">
            {formatCurrency(tour.price)}
            <span className="text-sm font-normal text-neutral-dark/70">/{t('tours.perPerson')}</span>
          </div>
          <Link href={`/tour/${tour.id}`}>
            <Button size="sm">
              {t('tours.viewDetails')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
