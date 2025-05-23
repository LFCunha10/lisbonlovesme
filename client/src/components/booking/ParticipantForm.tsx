import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ChevronRight, ChevronLeft } from "lucide-react";
import type { Tour } from "@shared/schema";

interface ParticipantFormProps {
  tour: Tour;
  onSelect: (data: {
    numberOfParticipants: number;
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    customerPhone: string;
    specialRequests: string;
  }) => void;
  onBack: () => void;
  maxParticipants: number;
}

const participantSchema = z.object({
  numberOfParticipants: z.number().min(1).max(20),
  customerFirstName: z.string().min(2, "First name must be at least 2 characters"),
  customerLastName: z.string().min(2, "Last name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string().min(6, "Please enter a valid phone number"),
  specialRequests: z.string().optional()
});

type ParticipantFormData = z.infer<typeof participantSchema>;

export function ParticipantForm({ tour, onSelect, onBack, maxParticipants }: ParticipantFormProps) {
  const { t } = useTranslation();
  const [participants, setParticipants] = useState(1);

  const form = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      numberOfParticipants: 1,
      customerFirstName: "",
      customerLastName: "",
      customerEmail: "",
      customerPhone: "",
      specialRequests: ""
    }
  });

  const onSubmit = (data: ParticipantFormData) => {
    onSelect({
      numberOfParticipants: participants,
      customerFirstName: data.customerFirstName,
      customerLastName: data.customerLastName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      specialRequests: data.specialRequests || ""
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('booking.participantDetails')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('booking.participantSubtitle')}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Number of Participants */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('booking.numberOfParticipants')}
              </h3>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="participants">
                {t('booking.selectParticipants')} (max {maxParticipants})
              </Label>
              <Select 
                value={participants.toString()} 
                onValueChange={(value) => {
                  const num = parseInt(value);
                  setParticipants(num);
                  form.setValue('numberOfParticipants', num);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('booking.selectNumber')} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: Math.min(maxParticipants, 10) }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? t('booking.person') : t('booking.people')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('booking.totalPrice')}: <span className="font-semibold text-primary">€{participants * tour.price}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('booking.contactInformation')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t('booking.firstName')} *</Label>
                <Input
                  id="firstName"
                  {...form.register('customerFirstName')}
                  placeholder={t('booking.enterFirstName')}
                  className="mt-1"
                />
                {form.formState.errors.customerFirstName && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.customerFirstName.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="lastName">{t('booking.lastName')} *</Label>
                <Input
                  id="lastName"
                  {...form.register('customerLastName')}
                  placeholder={t('booking.enterLastName')}
                  className="mt-1"
                />
                {form.formState.errors.customerLastName && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.customerLastName.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">{t('booking.email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('customerEmail')}
                  placeholder={t('booking.enterEmail')}
                  className="mt-1"
                />
                {form.formState.errors.customerEmail && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.customerEmail.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone">{t('booking.phone')} *</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register('customerPhone')}
                  placeholder={t('booking.enterPhone')}
                  className="mt-1"
                />
                {form.formState.errors.customerPhone && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.customerPhone.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Special Requests */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('booking.specialRequests')}
            </h3>
            <div>
              <Label htmlFor="requests">{t('booking.specialRequestsLabel')}</Label>
              <Textarea
                id="requests"
                {...form.register('specialRequests')}
                placeholder={t('booking.specialRequestsPlaceholder')}
                className="mt-1"
                rows={3}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('booking.specialRequestsHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('booking.back')}</span>
          </Button>
          
          <Button
            type="submit"
            className="flex items-center space-x-2"
          >
            <span>{t('booking.continue')}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}