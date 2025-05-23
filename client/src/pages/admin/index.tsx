import { useState } from "react";
import { Link } from "wouter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ManageTours from "./ManageTours";
import ManageAvailability from "./ManageAvailability";
import ViewBookings from "./ViewBookings";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("tours");

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              className="mb-2"
              asChild
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Website
              </Link>
            </Button>
            <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          </div>
        </div>

        <Tabs 
          defaultValue="tours" 
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="tours">Manage Tours</TabsTrigger>
            <TabsTrigger value="availability">Manage Availability</TabsTrigger>
            <TabsTrigger value="bookings">View Bookings</TabsTrigger>
          </TabsList>
          <TabsContent value="tours">
            <ManageTours />
          </TabsContent>
          <TabsContent value="availability">
            <ManageAvailability />
          </TabsContent>
          <TabsContent value="bookings">
            <ViewBookings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
