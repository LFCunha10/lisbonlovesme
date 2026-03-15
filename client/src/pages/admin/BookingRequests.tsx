import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import AdminLayout from "@/components/admin/AdminLayout";
import { getLocalizedText, useLocalizedTourText } from "@/lib/tour-utils";
import {
  formatEditableConfirmationDate,
  formatEditableConfirmationTime,
  normalizeConfirmationDate,
  normalizeConfirmationTime,
} from "@/lib/booking-confirmation-inputs";
import { 
  Eye, 
  Check, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  MessageSquare,
  StickyNote
} from "lucide-react";

interface BookingRequest {
  id: number;
  tourId: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  numberOfParticipants: number;
  specialRequests?: string | null;
  bookingReference: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  confirmedDate?: string | null;
  confirmedTime?: string | null;
  confirmedMeetingPoint?: string | null;
  adminNotes?: string | null;
  additionalInfo?: {
    date?: string;
    time?: string;
  };
  tour?: {
    name: string | { en: string; pt: string; ru: string };
    duration: number;
  };
}

async function updateBookingRequest(id: number, updates: Partial<BookingRequest>) {
  const response = await apiRequest("PUT", `/api/admin/requests/${id}`, updates);
  return response.json();
}

async function sendBookingRequestConfirmation(id: number) {
  const response = await apiRequest("POST", `/api/admin/requests/${id}/confirm`);
  return response.json();
}

export default function BookingRequests() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  const { data: requests, isLoading } = useQuery({
    queryKey: ['/api/admin/requests'],
    select: (data) => data as BookingRequest[],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<BookingRequest> }) => {
      return updateBookingRequest(data.id, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/requests'] });
      toast({
        title: "Success",
        description: "Booking request updated successfully",
      });
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      console.error("Update request error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    },
  });

  const sendConfirmationMutation = useMutation({
    mutationFn: async (id: number) => {
      return sendBookingRequestConfirmation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/requests'] });
      toast({
        title: t('admin.requests.confirmationSent'),
        description: t('admin.requests.confirmationSent'),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send confirmation",
        variant: "destructive",
      });
    },
  });

  const handleConfirmBooking = (request: BookingRequest, formData: any) => {
    updateRequestMutation.mutate({
      id: request.id,
      updates: {
        paymentStatus: "confirmed",
        confirmedDate: formData.confirmedDate,
        confirmedTime: formData.confirmedTime,
        confirmedMeetingPoint: formData.confirmedMeetingPoint,
        adminNotes: formData.adminNotes,
      },
    });
  };

  const handleSendConfirmation = (requestId: number) => {
    sendConfirmationMutation.mutate(requestId);
  };

  const filteredRequests = requests?.filter(request => {
    if (activeTab === "pending") return request.paymentStatus === "requested";
    if (activeTab === "confirmed") return request.paymentStatus === "confirmed";
    if (activeTab === "cancelled") return request.paymentStatus === "cancelled";
    return true;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t('admin.requests.pending')}</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t('admin.requests.confirmed')}</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t('admin.requests.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold">{t('admin.requests.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title={t('admin.requests.title')}>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('admin.requests.title')}</h2>
            <p className="text-muted-foreground">{t('admin.requests.subtitle')}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">{t('admin.requests.pending')} ({requests?.filter(r => r.paymentStatus === "requested").length || 0})</TabsTrigger>
            <TabsTrigger value="confirmed">{t('admin.requests.confirmed')} ({requests?.filter(r => r.paymentStatus === "confirmed").length || 0})</TabsTrigger>
            <TabsTrigger value="cancelled">{t('admin.requests.cancelled')} ({requests?.filter(r => r.paymentStatus === "cancelled").length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">{t('admin.requests.noRequests')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {request.customerFirstName} {request.customerLastName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {t('booking.referenceNumber')}: {request.bookingReference}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.paymentStatus)}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {t('admin.requests.viewDetails')}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              {selectedRequest && <RequestDetailsDialog request={selectedRequest} />}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{request.customerEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{request.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{t('booking.participants')}: {request.numberOfParticipants}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {request.paymentStatus === "confirmed" && request.confirmedDate && request.confirmedTime
                              ? `${new Date(request.confirmedDate).toLocaleDateString("pt-PT")} at ${request.confirmedTime}`
                              : request.additionalInfo?.date
                                ? `${request.additionalInfo.date} ${request.additionalInfo.time || ''}`
                                : 'TBD'
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function RequestDetailsDialog({ request }: { request: BookingRequest }) {
  const { t } = useTranslation();
  const getText = useLocalizedTourText();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    confirmedDate: formatEditableConfirmationDate(request.confirmedDate || request.additionalInfo?.date || ''),
    confirmedTime: formatEditableConfirmationTime(request.confirmedTime || request.additionalInfo?.time || ''),
    confirmedMeetingPoint: request.confirmedMeetingPoint || '',
    adminNotes: request.adminNotes || '',
  });

  const updateRequestMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<BookingRequest> }) => {
      return updateBookingRequest(data.id, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/requests'] });
      toast({
        title: "Success",
        description: "Booking request updated successfully",
      });
    },
  });

  const sendConfirmationMutation = useMutation({
    mutationFn: async (id: number) => {
      return sendBookingRequestConfirmation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/requests'] });
      toast({
        title: t('admin.requests.confirmationSent'),
        description: t('admin.requests.confirmationSent'),
      });
    },
  });

  const getNormalizedConfirmationDetails = () => {
    const normalizedDate = normalizeConfirmationDate(formData.confirmedDate);
    const normalizedTime = normalizeConfirmationTime(formData.confirmedTime);

    if (!normalizedDate) {
      toast({
        title: "Error",
        description: "Confirmed date must be valid. Use YYYY-MM-DD.",
        variant: "destructive",
      });
      return null;
    }

    if (!normalizedTime) {
      toast({
        title: "Error",
        description: "Confirmed time must be valid. Use HH:MM or HH:MM AM/PM.",
        variant: "destructive",
      });
      return null;
    }

    return {
      confirmedDate: normalizedDate,
      confirmedTime: normalizedTime,
      confirmedMeetingPoint: formData.confirmedMeetingPoint,
      adminNotes: formData.adminNotes,
    };
  };

  const handleSaveAndConfirm = async () => {
    const normalizedDetails = getNormalizedConfirmationDetails();
    if (!normalizedDetails) {
      return;
    }

    console.log("Confirming booking with data:", {
      ...formData,
      confirmedDate: normalizedDetails.confirmedDate,
      confirmedTime: normalizedDetails.confirmedTime,
    });
    try {
      // First update the booking
      await updateRequestMutation.mutateAsync({
        id: request.id,
        updates: {
          paymentStatus: "confirmed",
          ...normalizedDetails,
        },
      });
      
      // Then send confirmation email
      await sendConfirmationMutation.mutateAsync(request.id);
    } catch (error) {
      console.error("Error in confirm and send:", error);
    }
  };

  const handleSendConfirmation = async () => {
    const normalizedDetails = getNormalizedConfirmationDetails();
    if (!normalizedDetails) {
      return;
    }

    try {
      await updateRequestMutation.mutateAsync({
        id: request.id,
        updates: normalizedDetails,
      });

      await sendConfirmationMutation.mutateAsync(request.id);
    } catch (error) {
      console.error("Error saving confirmation details:", error);
    }
  };

  const handleConfirmedDateBlur = () => {
    const normalizedDate = normalizeConfirmationDate(formData.confirmedDate);
    if (!normalizedDate) return;

    setFormData((prev) => ({
      ...prev,
      confirmedDate: formatEditableConfirmationDate(normalizedDate),
    }));
  };

  const handleConfirmedTimeBlur = () => {
    const normalizedTime = normalizeConfirmationTime(formData.confirmedTime);
    if (!normalizedTime) return;

    setFormData((prev) => ({
      ...prev,
      confirmedTime: formatEditableConfirmationTime(normalizedTime),
    }));
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>{t('admin.requests.viewDetails')} - {request.bookingReference}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-6">
        {/* Customer Information */}
        <div>
          <h3 className="font-semibold mb-3">{t('admin.requests.customerInfo')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">{t('booking.name')}</Label>
              <p>{request.customerFirstName} {request.customerLastName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('booking.email')}</Label>
              <p>{request.customerEmail}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('booking.phone')}</Label>
              <p>{request.customerPhone}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('booking.participants')}</Label>
              <p>{request.numberOfParticipants}</p>
            </div>
          </div>
        </div>

        {/* Tour Details */}
        <div>
          <h3 className="font-semibold mb-3">{t('admin.requests.tourDetails')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">{t('tours.collection.title')}</Label>
              <p>{request.tour ? getText(request.tour.name) : 'Tour not found'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('admin.requests.totalAmount')}</Label>
              {((request.additionalInfo as any)?.pricing?.discount) ? (
                <div>
                  <div>Original: €{((((request.additionalInfo as any).pricing.originalAmount || 0) / 100).toFixed(2))}</div>
                  <div>Discount{(request as any).additionalInfo?.pricing?.discount?.code ? ` (${(request as any).additionalInfo.pricing.discount.code})` : ''}: -€{((((request as any).additionalInfo?.pricing?.discount?.appliedAmount || 0) / 100).toFixed(2))}</div>
                  <div><strong>Total: €{(((request.totalAmount || 0) / 100).toFixed(2))}</strong></div>
                </div>
              ) : (
                <p>€{(request.totalAmount / 100).toFixed(2)}</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">{t('admin.requests.requestedDateTime')}</Label>
              <p>{request.additionalInfo?.date || 'TBD'} {request.additionalInfo?.time || ''}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('booking.date')}</Label>
              <p>{request.createdAt ? format(new Date(request.createdAt), 'PPp') : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        {request.specialRequests && (
          <div>
            <h3 className="font-semibold mb-3">{t('admin.requests.specialRequests')}</h3>
            <p className="text-sm bg-muted p-3 rounded">{request.specialRequests}</p>
          </div>
        )}

        {/* Confirmation Details */}
        <div>
          <h3 className="font-semibold mb-3">{t('admin.requests.confirmationDetails')}</h3>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="confirmedDate">{t('admin.requests.confirmedDate')}</Label>
                <Input
                  id="confirmedDate"
                  value={formData.confirmedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmedDate: e.target.value }))}
                  onBlur={handleConfirmedDateBlur}
                  placeholder="2026-03-13"
                />
              </div>
              <div>
                <Label htmlFor="confirmedTime">{t('admin.requests.confirmedTime')}</Label>
                <Input
                  id="confirmedTime"
                  value={formData.confirmedTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmedTime: e.target.value }))}
                  onBlur={handleConfirmedTimeBlur}
                  placeholder="03:30 PM"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="confirmedMeetingPoint">{t('admin.requests.confirmedMeetingPoint')}</Label>
              <Input
                id="confirmedMeetingPoint"
                value={formData.confirmedMeetingPoint}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmedMeetingPoint: e.target.value }))}
                placeholder="Meeting point address"
              />
            </div>
            <div>
              <Label htmlFor="adminNotes">{t('admin.requests.adminNotes')}</Label>
              <Textarea
                id="adminNotes"
                value={formData.adminNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                placeholder="Internal notes..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {request.paymentStatus === "requested" && (
            <>
              <Button 
                onClick={handleSaveAndConfirm}
                disabled={updateRequestMutation.isPending}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                {updateRequestMutation.isPending ? 'Confirming...' : t('admin.requests.confirmBooking')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => updateRequestMutation.mutate({
                  id: request.id,
                  updates: { paymentStatus: "cancelled" }
                })}
                disabled={updateRequestMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                {t('admin.requests.cancelBooking')}
              </Button>
            </>
          )}
          {request.paymentStatus === "confirmed" && (
            <Button 
              onClick={handleSendConfirmation}
              disabled={sendConfirmationMutation.isPending}
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              {sendConfirmationMutation.isPending ? 'Sending...' : t('admin.requests.sendConfirmation')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
