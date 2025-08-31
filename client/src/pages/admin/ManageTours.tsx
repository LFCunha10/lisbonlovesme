import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTours } from "@/hooks/use-tours";
import { formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash, Plus } from "lucide-react";
import { InsertTour } from "@shared/schema";
import { getLocalizedText } from "@/lib/tour-utils";
import { useTranslation } from "react-i18next";

export default function ManageTours() {
  const { i18n } = useTranslation();
  const { tours, isLoading, error } = useTours({ all: true });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const defaultTour = {
    name: "",
    description: "",
    imageUrl: "",
    duration: "",
    maxGroupSize: 12,
    difficulty: "Moderate",
    price: 4500,
    badge: "",
    badgeColor: "primary",
    isActive: true,
  };

  const handleAdd = () => {
    setSelectedTour(defaultTour);
    setIsDialogOpen(true);
  };

  const handleEdit = (tour: any) => {
    setSelectedTour({
      ...tour,
      price: tour.price, // Price is already in cents in the database
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (tour: any) => {
    setSelectedTour(tour);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSelectedTour((prev: any) => ({
      ...prev,
      [name]: name === "price" ? parseInt(value) * 100 : value,
    }));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setSelectedTour((prev: any) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setSelectedTour((prev: any) => ({
      ...prev,
      isActive: checked,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const tourData: Partial<InsertTour> = {
        name: selectedTour.name,
        description: selectedTour.description,
        imageUrl: selectedTour.imageUrl,
        duration: selectedTour.duration,
        maxGroupSize: selectedTour.maxGroupSize,
        difficulty: selectedTour.difficulty,
        price: selectedTour.price,
        badge: selectedTour.badge || undefined,
        badgeColor: selectedTour.badgeColor || undefined,
        isActive: selectedTour.isActive,
      };

      const url = selectedTour.id 
        ? `/api/tours/${selectedTour.id}` 
        : "/api/tours";
      const method = selectedTour.id ? "PUT" : "POST";

      const response = await apiRequest(method, url, tourData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save tour");
      }

      toast({
        title: selectedTour.id ? "Tour Updated" : "Tour Created",
        description: `The tour has been ${selectedTour.id ? "updated" : "created"} successfully`,
      });

      // Invalidate tours cache to refresh both public and admin lists
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tours?all=1"] });
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("DELETE", `/api/tours/${selectedTour.id}`, undefined);
      
      if (!response.ok) {
        throw new Error("Failed to delete tour");
      }

      toast({
        title: "Tour Deleted",
        description: "The tour has been deleted successfully",
      });

      // Invalidate tours cache to refresh both public and admin lists
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tours?all=1"] });
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading tours...</div>;
  }

  if (error) {
    return <div>Error loading tours: {error.message}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Tours</h2>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add New Tour
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tours.map((tour) => (
          <Card key={tour.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{getLocalizedText(tour.name, i18n.language)}</CardTitle>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(tour)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(tour)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                {tour.badge && (
                  <Badge variant={tour.badgeColor === "secondary" ? "secondary" : "default"}>
                    {getLocalizedText(tour.badge, i18n.language)}
                  </Badge>
                )}
                <Badge variant="outline">{getLocalizedText(tour.duration, i18n.language)}</Badge>
                <Badge variant="outline">Max {tour.maxGroupSize} people</Badge>
                <Badge variant="outline">{getLocalizedText(tour.difficulty, i18n.language)}</Badge>
              </div>
              <p className="text-neutral-dark/70 text-sm mb-2 line-clamp-2">
                {getLocalizedText(tour.description, i18n.language)}
              </p>
              <div className="flex justify-between items-center mt-4">
                <div className="font-semibold">{formatCurrency(tour.price)}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-dark/70">Active:</span>
                  <Switch checked={tour.isActive ?? false} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Add Tour Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTour?.id ? "Edit Tour" : "Add New Tour"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Tour Name</Label>
              <Input
                id="name"
                name="name"
                value={selectedTour?.name || ""}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={selectedTour?.description || ""}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={selectedTour?.imageUrl || ""}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                name="duration"
                value={selectedTour?.duration || ""}
                onChange={handleInputChange}
                placeholder="e.g. 3 hours"
              />
            </div>
            
            <div>
              <Label htmlFor="maxGroupSize">Max Group Size</Label>
              <Input
                id="maxGroupSize"
                name="maxGroupSize"
                type="number"
                value={selectedTour?.maxGroupSize || 0}
                onChange={handleNumberChange}
                min={1}
              />
            </div>
            
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                name="difficulty"
                value={selectedTour?.difficulty || "Moderate"}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Challenging">Challenging</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="price">Price (€)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={(selectedTour?.price || 0) / 100} // Convert cents to euros for display
                onChange={handleInputChange}
                min={0}
                step={0.01}
              />
            </div>
            
            <div>
              <Label htmlFor="badge">Badge (optional)</Label>
              <Input
                id="badge"
                name="badge"
                value={selectedTour?.badge || ""}
                onChange={handleInputChange}
                placeholder="e.g. Most Popular"
              />
            </div>
            
            <div>
              <Label htmlFor="badgeColor">Badge Color</Label>
              <select
                id="badgeColor"
                name="badgeColor"
                value={selectedTour?.badgeColor || "primary"}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="primary">Blue (Primary)</option>
                <option value="secondary">Orange (Secondary)</option>
                <option value="accent">Pink (Accent)</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={selectedTour?.isActive || false}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="isActive">Active (visible to customers)</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Tour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tour</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete "{selectedTour?.name}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Tour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
