import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tour, InsertBooking } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SendEmail } from "@/lib/email";
import { AddToCalendar } from "@/lib/calendar";
import { CreditCard, Slack } from "lucide-react";

interface PaymentFormProps {
  onPrevious: () => void;
  onComplete: () => void;
  bookingData: any;
  tour?: Tour;
  updateBookingData: (data: any) => void;
}

export default function PaymentForm({
  onPrevious,
  onComplete,
  bookingData,
  tour,
  updateBookingData
}: PaymentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"credit-card" | "paypal">("credit-card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, boolean> = {};
    
    if (paymentMethod === "credit-card") {
      if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) 
        errors.cardNumber = true;
      if (!cardholderName) errors.cardholderName = true;
      if (!expiryDate || !expiryDate.match(/^\d{2}\/\d{2}$/)) 
        errors.expiryDate = true;
      if (!cvc || cvc.length < 3) errors.cvc = true;
    }
    
    if (!agreeToTerms) errors.agreeToTerms = true;
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Form Error",
        description: "Please fill in all required fields and agree to the terms."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create the booking first
      const bookingPayload: Partial<InsertBooking> = {
        tourId: bookingData.tourId,
        availabilityId: bookingData.availabilityId,
        customerFirstName: bookingData.customerFirstName,
        customerLastName: bookingData.customerLastName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        numberOfParticipants: bookingData.numberOfParticipants,
        specialRequests: bookingData.specialRequests,
        totalAmount: bookingData.totalAmount
      };
      
      const response = await apiRequest("POST", "/api/bookings", bookingPayload);
      const data = await response.json();
      
      if (response.ok) {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update booking status to confirm
        const confirmResponse = await apiRequest(
          "POST", 
          `/api/bookings/${data.booking.id}/confirm`,
          {}
        );
        
        if (confirmResponse.ok) {
          // Update bookingData with reference number and other details
          updateBookingData({
            ...data.booking,
            bookingReference: data.booking.bookingReference
          });
          
          toast({
            title: "Booking Successful",
            description: "Your tour has been booked successfully!"
          });
          
          onComplete();
        } else {
          throw new Error("Failed to confirm booking");
        }
      } else {
        throw new Error(data.message || "Failed to create booking");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format card number as it's entered (add spaces)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "");
    if (value.length > 16) return;
    
    // Add space every 4 characters
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formattedValue);
  };

  // Format expiry date as MM/YY
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) return;
    
    if (value.length > 2) {
      setExpiryDate(`${value.substring(0, 2)}/${value.substring(2)}`);
    } else {
      setExpiryDate(value);
    }
  };

  return (
    <div>
      <h4 className="text-xl font-semibold mb-4">Payment Details</h4>
      
      <div className="bg-neutral-light p-4 rounded-md mb-6">
        <h5 className="font-semibold mb-2">Order Summary</h5>
        {tour && (
          <div className="flex justify-between mb-2">
            <span>{tour.name}</span>
            <span>{formatCurrency(tour.price)} x {bookingData.numberOfParticipants}</span>
          </div>
        )}
        <div className="border-t border-neutral-dark/10 my-2"></div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatCurrency(bookingData.totalAmount)}</span>
        </div>
      </div>
      
      <div className="mb-6">
        <h5 className="font-semibold mb-3">Payment Method</h5>
        <RadioGroup 
          defaultValue="credit-card" 
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as "credit-card" | "paypal")}
          className="grid grid-cols-1 gap-3"
        >
          <div className={`flex items-center p-3 border rounded-md cursor-pointer ${paymentMethod === 'credit-card' ? 'border-primary' : 'border-neutral-light/80'}`}>
            <RadioGroupItem value="credit-card" id="credit-card" className="mr-3" />
            <Label htmlFor="credit-card" className="cursor-pointer flex-grow">Credit Card</Label>
            <div className="ml-auto flex space-x-2 text-neutral-dark/70">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          
          <div className={`flex items-center p-3 border rounded-md cursor-pointer ${paymentMethod === 'paypal' ? 'border-primary' : 'border-neutral-light/80'}`}>
            <RadioGroupItem value="paypal" id="paypal" className="mr-3" />
            <Label htmlFor="paypal" className="cursor-pointer flex-grow">PayPal</Label>
            <Slack className="h-5 w-5 ml-auto text-[#0070BA]" />
          </div>
        </RadioGroup>
      </div>
      
      {paymentMethod === "credit-card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <Label htmlFor="cardNumber" className="block text-neutral-dark/80 mb-1">Card Number</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={handleCardNumberChange}
              className={formErrors.cardNumber ? "border-error" : ""}
            />
            {formErrors.cardNumber && (
              <p className="text-error text-sm mt-1">Please enter a valid card number</p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="cardholderName" className="block text-neutral-dark/80 mb-1">Cardholder Name</Label>
            <Input
              id="cardholderName"
              type="text"
              placeholder="John Doe"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className={formErrors.cardholderName ? "border-error" : ""}
            />
            {formErrors.cardholderName && (
              <p className="text-error text-sm mt-1">Please enter the cardholder name</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="expiryDate" className="block text-neutral-dark/80 mb-1">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="text"
              placeholder="MM/YY"
              value={expiryDate}
              onChange={handleExpiryDateChange}
              className={formErrors.expiryDate ? "border-error" : ""}
            />
            {formErrors.expiryDate && (
              <p className="text-error text-sm mt-1">Please enter a valid expiry date</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="cvc" className="block text-neutral-dark/80 mb-1">CVC</Label>
            <Input
              id="cvc"
              type="text"
              placeholder="123"
              value={cvc}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 4) setCvc(value);
              }}
              className={formErrors.cvc ? "border-error" : ""}
            />
            {formErrors.cvc && (
              <p className="text-error text-sm mt-1">Please enter a valid CVC</p>
            )}
          </div>
        </div>
      )}
      
      {paymentMethod === "paypal" && (
        <div className="mb-6 p-4 bg-neutral-light/50 rounded text-center">
          <p>You will be redirected to PayPal to complete your payment after clicking "Complete Booking".</p>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex items-start">
          <Checkbox 
            id="terms" 
            checked={agreeToTerms}
            onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
            className={`mt-1 mr-3 ${formErrors.agreeToTerms ? 'border-error' : ''}`}
          />
          <Label htmlFor="terms" className="text-neutral-dark/80">
            I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </Label>
        </div>
        {formErrors.agreeToTerms && (
          <p className="text-error text-sm mt-1">You must agree to the terms and conditions</p>
        )}
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onPrevious}
          disabled={isLoading}
        >
          Previous
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Complete Booking"}
        </Button>
      </div>
    </div>
  );
}
