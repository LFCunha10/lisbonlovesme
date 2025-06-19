import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTours, useAvailabilities } from "@/hooks/use-tours";
import { formatDate, formatTime } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, Calendar as CalendarIcon } from "lucide-react";
import { InsertAvailability } from "@shared/schema";

export default function ManageAvailability() {
  const { tours, isLoading: isLoadingTours } = useTours();
  const [selectedTourId, setSelectedTourId] = useState<number>(0);
  const { availabilities, isLoading: isLoadingAvailabilities, error } = useAvailabilities(
    selectedTourId || undefined
  );
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hourStr = hour.toString().padStart(2, "0");
        const minuteStr = minute.toString().padStart(2, "0");
        options.push(`${hourStr}:${minuteStr}`);
      }
    }
    return options;
  };
  
  const timeOptions = generateTimeOptions();
  
  const handleAdd = () => {
    setSelectedAvailability({
      tourId: selectedTourId,
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      maxSpots: 12,
      spotsLeft: 12,
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = (availability: any) => {
    setSelectedAvailability(availability);
    setIsDeleteDialogOpen(true);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedAvailability((prev: any) => ({
      ...prev,
      [name]: name === "maxSpots" || name === "spotsLeft" ? parseInt(value) : value,
    }));
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Use local date format to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;
      
      setSelectedAvailability((prev: any) => ({
        ...prev,
        date: localDateStr,
      }));
    }
  };
  
  const handleTimeChange = (time: string) => {
    setSelectedAvailability((prev: any) => ({
      ...prev,
      time,
    }));
  };
  
  const handleTourChange = (tourId: string) => {
    setSelectedAvailability((prev: any) => ({
      ...prev,
      tourId: parseInt(tourId),
    }));
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // If spotsLeft is not set, set it equal to maxSpots
      if (selectedAvailability.spotsLeft === undefined) {
        selectedAvailability.spotsLeft = selectedAvailability.maxSpots;
      }
      
      const availabilityData: InsertAvailability = {
        tourId: selectedAvailability.tourId,
        date: selectedAvailability.date,
        time: selectedAvailability.time,
        maxSpots: selectedAvailability.maxSpots,
        spotsLeft: selectedAvailability.spotsLeft,
      };
      
      const response = await apiRequest("POST", "/api/availabilities", availabilityData);
      const data = await response.json();
      console.log("Availability created:", data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save availability");
      }
      
      toast({
        title: "Availability Created",
        description: "The availability has been created successfully",
      });
      
      // Invalidate availabilities cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/availabilities"] });
      
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
      const response = await apiRequest(
        "DELETE",
        `/api/availabilities/${selectedAvailability.id}`,
        undefined
      );
      
      if (!response.ok) {
        throw new Error("Failed to delete availability");
      }
      
      toast({
        title: "Availability Deleted",
        description: "The availability has been deleted successfully",
      });
      
      // Invalidate availabilities cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/availabilities"] });
      
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Availability</h2>
        <Button 
          onClick={handleAdd}
          disabled={!selectedTourId}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Availability
        </Button>
      </div>
      
      <div className="mb-6">
        <Label htmlFor="tourFilter" className="mb-2 block">
          Filter by Tour
        </Label>
        <Select 
          value={selectedTourId ? selectedTourId.toString() : ""} 
          onValueChange={(value) => {
            setSelectedTourId(value ? parseInt(value) : 0);
          }}
        >
          <SelectTrigger id="tourFilter" className="w-full md:w-1/2">
            <SelectValue placeholder="Select a tour" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Tours</SelectItem>
            {tours.map((tour) => (
              <SelectItem key={tour.id} value={tour.id.toString()}>
                {tour.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isLoadingAvailabilities ? (
        <div>Loading availabilities...</div>
      ) : error ? (
        <div>Error loading availabilities: {error.message}</div>
      ) : availabilities.length === 0 ? (
        <div className="text-center py-8 bg-neutral-light/30 rounded-md">
          <CalendarIcon className="h-12 w-12 mx-auto text-neutral-dark/40 mb-2" />
          <p className="text-lg text-neutral-dark/70">No availabilities found</p>
          <p className="text-sm text-neutral-dark/50 mb-4">
            {selectedTourId 
              ? "Try adding availabilities for this tour" 
              : "Select a tour to manage its availabilities"}
          </p>
          {selectedTourId && (
            <Button onClick={handleAdd} variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Add Availability
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availabilities.map((availability) => {
            const tour = tours.find((t) => t.id === availability.tourId);
            return (
              <Card key={availability.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{tour?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center text-sm mb-1">
                        <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                        {formatDate(availability.date)}
                      </div>
                      <div className="text-sm mb-2">
                        Time: {formatTime(availability.time)}
                      </div>
                      <div className="text-sm">
                        Spots: {availability.spotsLeft}/{availability.maxSpots}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(availability)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Availability Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4">
            <div>
              <Label htmlFor="tour">Tour</Label>
              <Select 
                value={selectedAvailability?.tourId.toString() || ""} 
                onValueChange={handleTourChange}
              >
                <SelectTrigger id="tour">
                  <SelectValue placeholder="Select a tour" />
                </SelectTrigger>
                <SelectContent>
                  {tours.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id.toString()}>
                      {tour.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Date</Label>
              <div className="border rounded-md mt-1">
                <Calendar
                  mode="single"
                  selected={selectedAvailability?.date ? new Date(selectedAvailability.date) : undefined}
                  onSelect={handleDateChange}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="time">Time</Label>
              <Select 
                value={selectedAvailability?.time || "09:00"} 
                onValueChange={handleTimeChange}
              >
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {formatTime(time)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="maxSpots">Maximum Spots</Label>
              <Input
                id="maxSpots"
                name="maxSpots"
                type="number"
                value={selectedAvailability?.maxSpots || 12}
                onChange={handleInputChange}
                min={1}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Availability"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Availability</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this availability for{" "}
            {formatDate(selectedAvailability?.date || "")} at{" "}
            {formatTime(selectedAvailability?.time || "")}?
          </p>
          <p className="text-sm text-neutral-dark/70">
            This will remove the time slot and any associated bookings will be affected.
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
              {isSubmitting ? "Deleting..." : "Delete Availability"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
