import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Globe, Save, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLocalizedText } from "@/lib/tour-utils";
import type { Tour } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

// Multilingual form schema
const multilingualTourSchema = z.object({
  name: z.object({
    en: z.string().min(1, "English name is required"),
    pt: z.string().min(1, "Portuguese name is required"),
    ru: z.string().min(1, "Russian name is required"),
  }),
  description: z.object({
    en: z.string().min(1, "English description is required"),
    pt: z.string().min(1, "Portuguese description is required"),
    ru: z.string().min(1, "Russian description is required"),
  }),
  shortDescription: z.object({
    en: z.string().optional(),
    pt: z.string().optional(),
    ru: z.string().optional(),
  }).optional(),
  duration: z.object({
    en: z.string().min(1, "English duration is required"),
    pt: z.string().min(1, "Portuguese duration is required"),
    ru: z.string().min(1, "Russian duration is required"),
  }),
  difficulty: z.object({
    en: z.string().min(1, "English difficulty is required"),
    pt: z.string().min(1, "Portuguese difficulty is required"),
    ru: z.string().min(1, "Russian difficulty is required"),
  }),
  badge: z.object({
    en: z.string().optional(),
    pt: z.string().optional(),
    ru: z.string().optional(),
  }).optional(),
  price: z.number().min(0, "Price must be positive"),
  priceType: z.enum(["per_person", "per_group"]),
  maxGroupSize: z.number().min(1, "Group size must be at least 1"),
  imageUrl: z.string().optional(),
  badgeColor: z.string().optional(),
  featured: z.boolean().optional(),
});

type MultilingualTourForm = z.infer<typeof multilingualTourSchema>;

// Removed translation service - will be added back later

export default function EditTourPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'pt' | 'ru'>('en');
  // Translation state removed

  const tourId = parseInt(id as string);
  const isEditing = !isNaN(tourId);

  // Fetch tour data if editing
  const { data: tour, isLoading } = useQuery({
    queryKey: ['tours', tourId],
    queryFn: () => fetch(`/api/tours/${tourId}`).then(res => res.json()),
    enabled: isEditing,
  });

  const form = useForm<MultilingualTourForm>({
    resolver: zodResolver(multilingualTourSchema),
    defaultValues: {
      name: { en: "", pt: "", ru: "" },
      description: { en: "", pt: "", ru: "" },
      shortDescription: { en: "", pt: "", ru: "" },
      duration: { en: "", pt: "", ru: "" },
      difficulty: { en: "", pt: "", ru: "" },
      badge: { en: "", pt: "", ru: "" },
      price: 0,
      priceType: "per_person",
      maxGroupSize: 1,
      imageUrl: "",
      badgeColor: "primary",
      featured: false,
    },
  });

  // Populate form when tour data is loaded
  useEffect(() => {
    if (tour && isEditing) {
      const tourData = {
        name: tour.name || { en: "", pt: "", ru: "" },
        description: tour.description || { en: "", pt: "", ru: "" },
        shortDescription: tour.shortDescription || { en: "", pt: "", ru: "" },
        duration: tour.duration || { en: "", pt: "", ru: "" },
        difficulty: tour.difficulty || { en: "", pt: "", ru: "" },
        badge: typeof tour.badge === 'string' ? { en: tour.badge, pt: '', ru: '' } : tour.badge || { en: "", pt: "", ru: "" },
        price: tour.price / 100, // Convert from cents
        priceType: tour.priceType || "per_person",
        maxGroupSize: tour.maxGroupSize || 1,
        imageUrl: tour.imageUrl || "",
        badgeColor: tour.badgeColor || "primary",
        featured: tour.featured || false,
      };
      form.reset(tourData);
    }
  }, [tour, isEditing, form]);

  // Create/Update tour mutation
  const tourMutation = useMutation({
    mutationFn: async (data: MultilingualTourForm) => {
      // Get CSRF token
      const csrfResponse = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      const { csrfToken } = await csrfResponse.json();

      const payload = {
        ...data,
        price: Math.round(data.price * 100), // Convert to cents
      };

      const url = isEditing ? `/api/tours/${tourId}` : "/api/tours";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} tour`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Tour updated" : "Tour created",
        description: isEditing ? "Tour has been updated successfully" : "New tour has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      navigate('/admin/tours');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save tour",
        variant: "destructive",
      });
    },
  });

  // Translation functionality removed - will be added back later

  const onSubmit = (data: MultilingualTourForm) => {
    tourMutation.mutate(data);
  };

  if (isEditing && isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/tours')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tours
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Edit Tour' : 'Create New Tour'}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Multilingual Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={currentLanguage} onValueChange={(value) => setCurrentLanguage(value as 'en' | 'pt' | 'ru')}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="pt">Português</TabsTrigger>
                    <TabsTrigger value="ru">Русский</TabsTrigger>
                  </TabsList>

                  {(['en', 'pt', 'ru'] as const).map((lang) => (
                    <TabsContent key={lang} value={lang} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          {lang === 'en' && 'English Content'}
                          {lang === 'pt' && 'Portuguese Content'}
                          {lang === 'ru' && 'Russian Content'}
                        </h3>
                        <div className="flex gap-2">
                          <span className="text-sm text-gray-500 py-2">
                            {lang === 'en' && 'English content (source language)'}
                            {lang === 'pt' && 'Portuguese content'}
                            {lang === 'ru' && 'Russian content'}
                          </span>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name={`name.${lang}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tour Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={`Enter tour name in ${lang === 'en' ? 'English' : lang === 'pt' ? 'Portuguese' : 'Russian'}`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`shortDescription.${lang}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`Brief description in ${lang === 'en' ? 'English' : lang === 'pt' ? 'Portuguese' : 'Russian'}`}
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`description.${lang}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Description</FormLabel>
                            <FormControl>
                              <RichTextEditor
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <p className="text-sm text-gray-500 mt-1">
                              Use the toolbar to format text, add images, links, and more. Content will be displayed with formatting on the website.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`badge.${lang}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Badge Text</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={`e.g., "Popular" in ${lang === 'en' ? 'English' : lang === 'pt' ? 'Portuguese' : 'Russian'}`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`badge.${lang}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Badge Text</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={`e.g., "Popular" in ${lang === 'en' ? 'English' : lang === 'pt' ? 'Portuguese' : 'Russian'}`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`badge.${lang}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Badge Text</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={`e.g., "Popular" in ${lang === 'en' ? 'English' : lang === 'pt' ? 'Portuguese' : 'Russian'}`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`duration.${lang}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={`e.g., "2 hours" in ${lang === 'en' ? 'English' : lang === 'pt' ? 'Portuguese' : 'Russian'}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`difficulty.${lang}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Difficulty</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {lang === 'en' && (
                                    <>
                                      <SelectItem value="Easy">Easy</SelectItem>
                                      <SelectItem value="Medium">Medium</SelectItem>
                                      <SelectItem value="Hard">Hard</SelectItem>
                                    </>
                                  )}
                                  {lang === 'pt' && (
                                    <>
                                      <SelectItem value="Fácil">Fácil</SelectItem>
                                      <SelectItem value="Médio">Médio</SelectItem>
                                      <SelectItem value="Difícil">Difícil</SelectItem>
                                    </>
                                  )}
                                  {lang === 'ru' && (
                                    <>
                                      <SelectItem value="Легкий">Легкий</SelectItem>
                                      <SelectItem value="Средний">Средний</SelectItem>
                                      <SelectItem value="Сложный">Сложный</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tour Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="per_person">Per Person</SelectItem>
                            <SelectItem value="per_group">Per Group</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="maxGroupSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Group Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                    control={form.control}
                    name="badgeColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Badge Color</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="accent">Accent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={tourMutation.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {tourMutation.isPending ? 'Saving...' : isEditing ? 'Update Tour' : 'Create Tour'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/admin/tours')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}