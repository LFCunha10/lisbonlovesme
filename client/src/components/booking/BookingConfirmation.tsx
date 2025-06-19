import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calendar, Users, Euro, Mail, Phone, Home } from "lucide-react";
import { Link } from "wouter";
import { getLocalizedText } from "@/lib/tour-utils";
import type { Tour } from "@shared/schema";

interface BookingData {
  date: string;
  time: string;
  availabilityId: number;
  numberOfParticipants: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests: string;
}

interface BookingConfirmationProps {
  tour: Tour;
  bookingData: BookingData;
  bookingReference: string;
  totalAmount: number;
}

export default function BookingConfirmation({ tour, bookingData, bookingReference, totalAmount }: BookingConfirmationProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('booking.confirmationSentRequest')}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('booking.confirmationSentRequestSubtitle')}
        </p>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 inline-block">
          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
            {t('booking.referenceNumber')}: <span className="font-bold text-green-800 dark:text-green-200">{bookingReference}</span>
          </p>
        </div>
      </div>

      {/* Booking Details */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {t('booking.bookingDetails')}
          </h3>
          
          <div className="flex space-x-4 mb-6">
            <img
              src={tour.imageUrl}
              alt={getLocalizedText(tour.name, i18n.language)}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                {getLocalizedText(tour.name, i18n.language)}
              </h4>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {getLocalizedText(tour.duration, i18n.language)} • {getLocalizedText(tour.difficulty, i18n.language)}
              </p>
              {tour.badge && getLocalizedText(tour.badge, i18n.language) && (
                <Badge variant="secondary">
                  {getLocalizedText(tour.badge, i18n.language)}
                </Badge>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('booking.dateTime')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(bookingData.date).toLocaleDateString("pt-PT")} • {bookingData.time}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('booking.participants')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {bookingData.numberOfParticipants} {bookingData.numberOfParticipants === 1 ? t('booking.person') : t('booking.people')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Euro className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('booking.valueToPay')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">€{totalAmount}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('booking.email')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{bookingData.customerEmail}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('booking.phone')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{bookingData.customerPhone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Home className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('booking.customer')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {bookingData.customerFirstName} {bookingData.customerLastName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {bookingData.specialRequests && (
            <>
              <Separator className="my-6" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('booking.specialRequests')}</p>
                <p className="font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  {bookingData.specialRequests}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('booking.whatsNext')}
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('booking.nextStep1')}
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('booking.nextStep2')}
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('booking.nextStep3')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full">
            <Home className="w-4 h-4 mr-2" />
            {t('booking.backToHome')}
          </Button>
        </Link>
        <Link href={`/tour/${tour.id}`} className="flex-1">
          <Button className="w-full">
            {t('booking.viewTour')}
          </Button>
        </Link>
      </div>

      {/* Support Note */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 border-t pt-6">
        <p>
          {t('booking.supportNote')} <br />
          {t('booking.contactInfo')}
        </p>
      </div>
    </div>
  );
}