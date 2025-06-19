import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save } from "lucide-react";
import MultilingualEditor from "./multilingual-editor";
import type { Tour } from "@shared/schema";

interface TourFormData {
  price: number;
  priceType: 'per_person' | 'per_group';
  maxGroupSize: number;
  imageUrl: string;
  meetingPoint: string;
  name: { en: string; pt: string; ru: string };
  shortDescription: { en: string; pt: string; ru: string };
  description: { en: string; pt: string; ru: string };
  duration: { en: string; pt: string; ru: string };
  difficulty: { en: string; pt: string; ru: string };
  badge: { en: string; pt: string; ru: string };
}

export default function EditTour() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<TourFormData>({
    price: 0,
    priceType: 'per_person',
    maxGroupSize: 8,
    imageUrl: '',
    meetingPoint: '',
    name: { en: '', pt: '', ru: '' },
    shortDescription: { en: '', pt: '', ru: '' },
    description: { en: '', pt: '', ru: '' },
    duration: { en: '', pt: '', ru: '' },
    difficulty: { en: '', pt: '', ru: '' },
    badge: { en: '', pt: '', ru: '' }
  });

  const { data: tour, isLoading } = useQuery<Tour>({
    queryKey: [`/api/tours/${id}`],
    enabled: !!id
  });

  useEffect(() => {
    if (tour) {
      setFormData({
        price: tour.price,
        priceType: tour.priceType as 'per_person' | 'per_group',
        maxGroupSize: tour.maxGroupSize,
        imageUrl: tour.imageUrl || '',
        meetingPoint: (tour as any).meetingPoint || '',
        name: typeof tour.name === 'string' ? { en: tour.name, pt: '', ru: '' } : tour.name,
        shortDescription: typeof tour.shortDescription === 'string' ? { en: tour.shortDescription, pt: '', ru: '' } : tour.shortDescription || { en: '', pt: '', ru: '' },
        description: typeof tour.description === 'string' ? { en: tour.description, pt: '', ru: '' } : tour.description,
        duration: typeof tour.duration === 'string' ? { en: tour.duration, pt: '', ru: '' } : tour.duration,
        difficulty: typeof tour.difficulty === 'string' ? { en: tour.difficulty, pt: '', ru: '' } : tour.difficulty,
        badge: typeof tour.badge === 'string' ? { en: tour.badge, pt: '', ru: '' } : tour.badge || { en: '', pt: '', ru: '' }
      });
    }
  }, [tour]);

  const updateMutation = useMutation({
    mutationFn: async (data: TourFormData) => {
      const response = await apiRequest("PUT", `/api/tours/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tour updated successfully",
        description: "The tour has been updated with the new information."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      setLocation('/admin/tours');
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error updating tour",
        description: "Please try again."
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleMultilingualChange = (data: {
    name: { en: string; pt: string; ru: string };
    shortDescription: { en: string; pt: string; ru: string };
    description: { en: string; pt: string; ru: string };
    duration: { en: string; pt: string; ru: string };
    difficulty: { en: string; pt: string; ru: string };
    badge: { en: string; pt: string; ru: string };
  }) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/admin/tours')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tours
        </Button>
        <h1 className="text-3xl font-bold">Edit Tour</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <MultilingualEditor 
          tourData={formData}
          onChange={handleMultilingualChange}
        />

        <Card>
          <CardHeader>
            <CardTitle>Tour Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="priceType">Price Type</Label>
                <Select value={formData.priceType} onValueChange={(value: 'per_person' | 'per_group') => setFormData(prev => ({ ...prev, priceType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_person">Per Person</SelectItem>
                    <SelectItem value="per_group">Per Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxGroupSize">Max Group Size</Label>
                <Input
                  id="maxGroupSize"
                  type="number"
                  value={formData.maxGroupSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxGroupSize: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="meetingPoint">Meeting Point</Label>
              <Textarea
                id="meetingPoint"
                value={formData.meetingPoint}
                onChange={(e) => setFormData(prev => ({ ...prev, meetingPoint: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setLocation('/admin/tours')}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Tour'}
          </Button>
        </div>
      </form>
    </div>
  );
}