import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

// Multilingual form schema
const multilingualTourSchema = z.object({
  name: z.object({
    en: z.string().min(1, "English name is required"),
    pt: z.string().min(1, "Portuguese name is required"),
    ru: z.string().min(1, "Russian name is required"),
  }),
  description: z.object({
    en: z.string().min(10, "English description must be at least 10 characters"),
    pt: z.string().min(10, "Portuguese description must be at least 10 characters"),
    ru: z.string().min(10, "Russian description must be at least 10 characters"),
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
  isActive: z.boolean().optional(),
});

type MultilingualTourForm = z.infer<typeof multilingualTourSchema>;

const badgeColors = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "accent", label: "Accent" },
];

export default function CreateTourPage() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'pt' | 'ru'>('en');
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

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
      isActive: true,
    },
  });

  // Create tour mutation
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
        isActive: data.isActive ?? true,
      };

      const response = await fetch("/api/tours", {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create tour");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tour created",
        description: "New tour has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tours?all=1'] });
      navigate('/admin/tours');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tour",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const formData = form.getValues();
    tourMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Tour</h1>
        <Form {...form}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Multilingual Content</CardTitle>
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
                          {badgeColors.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              {color.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active (visible to customers)</FormLabel>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value ?? false}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Featured</FormLabel>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <div className="flex gap-4">
              <Button 
                type="button"
                onClick={handleSave}
                disabled={tourMutation.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {tourMutation.isPending ? 'Creating...' : 'Create Tour'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/admin/tours')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
