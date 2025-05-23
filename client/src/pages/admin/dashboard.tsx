import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, PencilIcon, BookOpenIcon, MessageSquareIcon, LogOutIcon } from "lucide-react";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/session");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Redirect to login if not authenticated
          setLocation("/admin/login");
        }
      } catch (error) {
        toast({
          title: "Authentication Error",
          description: "Could not verify your session. Please login again.",
          variant: "destructive",
        });
        setLocation("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setLocation, toast]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/admin/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Lisbonlovesme</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Lisbonlovesme Admin</h1>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-600">
                  Welcome, <span className="font-medium">{user.username}</span>
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOutIcon className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="dashboard">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="tours">Tours</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard 
                  title="Manage Tours" 
                  description="Create, edit and delete tours"
                  icon={<PencilIcon className="w-8 h-8" />}
                  linkTo="/admin/tours"
                  linkText="Manage Tours"
                />
                <DashboardCard 
                  title="Booking Calendar" 
                  description="View and manage all bookings"
                  icon={<CalendarIcon className="w-8 h-8" />}
                  linkTo="/admin/bookings"
                  linkText="View Calendar"
                />
                <DashboardCard 
                  title="Reviews" 
                  description="Approve and manage customer reviews"
                  icon={<MessageSquareIcon className="w-8 h-8" />}
                  linkTo="/admin/reviews"
                  linkText="Manage Reviews"
                />
              </div>
            </TabsContent>

            <TabsContent value="tours">
              <iframe 
                src="/admin/tours" 
                className="w-full h-[800px] border-none" 
                title="Tour Management"
              />
            </TabsContent>

            <TabsContent value="bookings">
              <iframe 
                src="/admin/bookings" 
                className="w-full h-[800px] border-none" 
                title="Booking Management"
              />
            </TabsContent>

            <TabsContent value="testimonials">
              <iframe 
                src="/admin/testimonials" 
                className="w-full h-[800px] border-none" 
                title="Testimonial Management"
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkTo: string;
  linkText: string;
}

function DashboardCard({ title, description, icon, linkTo, linkText }: DashboardCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm mb-4">{description}</CardDescription>
        <Button asChild variant="default" size="sm">
          <Link href={linkTo}>{linkText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}