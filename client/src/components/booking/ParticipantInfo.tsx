import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tour } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus } from "lucide-react";

interface ParticipantInfoProps {
  onNext: () => void;
  onPrevious: () => void;
  onUpdate: (data: any) => void;
  bookingData: any;
  tour?: Tour;
}

export default function ParticipantInfo({
  onNext,
  onPrevious,
  onUpdate,
  bookingData,
  tour
}: ParticipantInfoProps) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(bookingData.customerFirstName || "");
  const [lastName, setLastName] = useState(bookingData.customerLastName || "");
  const [email, setEmail] = useState(bookingData.customerEmail || "");
  const [phone, setPhone] = useState(bookingData.customerPhone || "");
  const [participants, setParticipants] = useState(bookingData.numberOfParticipants || 2);
  const [specialRequests, setSpecialRequests] = useState(bookingData.specialRequests || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const maxParticipants = tour?.maxGroupSize || 12;

  useEffect(() => {
    if (tour) {
      // Pre-calculate total amount based on number of participants
      onUpdate({
        totalAmount: tour.price * participants
      });
    }
  }, [participants, tour, onUpdate]);

  const decreaseParticipants = () => {
    if (participants > 1) {
      setParticipants(participants - 1);
    }
  };

  const increaseParticipants = () => {
    if (participants < maxParticipants) {
      setParticipants(participants + 1);
    }
  };

  const validateForm = () => {
    const schema = z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email address"),
      phone: z.string().min(7, "Valid phone number is required"),
      participants: z.number().min(1).max(maxParticipants, `Maximum ${maxParticipants} participants allowed`)
    });

    try {
      schema.parse({
        firstName,
        lastName,
        email,
        phone,
        participants
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          newErrors[err.path[0].toString()] = err.message;
        });
        setErrors(newErrors);
        
        // Show toast for the first error
        const firstError = error.errors[0];
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: firstError.message
        });
      }
      return false;
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onUpdate({
        customerFirstName: firstName,
        customerLastName: lastName,
        customerEmail: email,
        customerPhone: phone,
        numberOfParticipants: participants,
        specialRequests
      });
      onNext();
    }
  };

  return (
    <div>
      <h4 className="text-xl font-semibold mb-4">Participant Information</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="firstName" className="block text-neutral-dark/80 mb-1">
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={errors.firstName ? "border-error" : ""}
          />
          {errors.firstName && (
            <p className="text-error text-sm mt-1">{errors.firstName}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="lastName" className="block text-neutral-dark/80 mb-1">
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={errors.lastName ? "border-error" : ""}
          />
          {errors.lastName && (
            <p className="text-error text-sm mt-1">{errors.lastName}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="email" className="block text-neutral-dark/80 mb-1">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "border-error" : ""}
          />
          {errors.email && (
            <p className="text-error text-sm mt-1">{errors.email}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="phone" className="block text-neutral-dark/80 mb-1">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={errors.phone ? "border-error" : ""}
          />
          {errors.phone && (
            <p className="text-error text-sm mt-1">{errors.phone}</p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <Label htmlFor="participants" className="block text-neutral-dark/80 mb-1">
          Number of Participants
        </Label>
        <div className="flex items-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-r-none"
            onClick={decreaseParticipants}
            disabled={participants <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="participants"
            type="number"
            value={participants}
            onChange={(e) => setParticipants(parseInt(e.target.value) || 1)}
            min={1}
            max={maxParticipants}
            className="rounded-none w-16 text-center"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-l-none"
            onClick={increaseParticipants}
            disabled={participants >= maxParticipants}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span className="ml-3 text-neutral-dark/70">
            Maximum: {maxParticipants} people
          </span>
        </div>
        {errors.participants && (
          <p className="text-error text-sm mt-1">{errors.participants}</p>
        )}
      </div>
      
      <div className="mb-6">
        <Label htmlFor="specialRequests" className="block text-neutral-dark/80 mb-1">
          Special Requests (Optional)
        </Label>
        <Textarea
          id="specialRequests"
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          className="h-24"
          placeholder="Let us know if you have any special requirements or requests"
        />
      </div>
      
      {tour && (
        <div className="bg-neutral-light p-4 rounded-md mb-6">
          <h5 className="font-semibold mb-2">Price Summary</h5>
          <div className="flex justify-between mb-2">
            <span>{tour.name}</span>
            <span>{formatCurrency(tour.price)} x {participants}</span>
          </div>
          <div className="border-t border-neutral-dark/10 my-2"></div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(tour.price * participants)}</span>
          </div>
        </div>
      )}
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>Previous</Button>
        <Button onClick={handleSubmit}>Next Step</Button>
      </div>
    </div>
  );
}
