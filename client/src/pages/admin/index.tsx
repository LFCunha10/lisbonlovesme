import React from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarIcon, PencilIcon, MessageSquareIcon, LockIcon, Database as DatabaseIcon, ShoppingCart, Newspaper, Image, Tag } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";

export default function AdminIndexPage() {
  const [location, setLocation] = useLocation();
  const [authenticated, setAuthenticated] = React.useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Checking authentication...");
      try {
        const res = await fetch("/api/admin/session", {
          credentials: "include",
        });
        const data = await res.json();
        console.log("Auth check response:", data);

        if (data && data.isAuthenticated && data.isAdmin) {
          setAuthenticated(true);
        } else {
          throw new Error("Invalid user data");
        }
      } catch (err) {
        console.error("Auth check failed", err);
        console.log("Redirecting to login", err);
        setAuthenticated(false);
        setLocation("/admin/login");
      }
    };

    checkAuth();
  }, [setLocation]);

  if (authenticated === null) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <AdminLayout title="Dashboard">
      <header className="bg-white shadow-sm mb-6 rounded-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Lisbonlovesme Admin</h1>
          <div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                Return to Website
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome to the Admin Dashboard</h2>
          <p className="text-gray-500">Manage your tours, bookings, and reviews</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard 
            title="Manage Tours" 
            description="Create, edit and delete tours"
            icon={<PencilIcon className="w-8 h-8" />}
            linkTo="/admin/tours"
            linkText="Manage Tours"
          />
          <DashboardCard 
            title="Booking Requests" 
            description="Manage customer booking requests"
            icon={<ShoppingCart className="w-8 h-8" />}
            linkTo="/admin/requests"
            linkText="View Requests"
          />
          <DashboardCard 
            title="Booking Calendar" 
            description="View and manage all bookings"
            icon={<CalendarIcon className="w-8 h-8" />}
            linkTo="/admin/bookings"
            linkText="View Calendar"
          />
          <DashboardCard 
            title="Articles" 
            description="Create and edit articles"
            icon={<Newspaper className="w-8 h-8" />}
            linkTo="/admin/articles"
            linkText="Manage Articles"
          />
          <DashboardCard 
            title="Gallery" 
            description="Add and change images"
            icon={<Image className="w-8 h-8" />}
            linkTo="/admin/gallery"
            linkText="Manage Images"
          />
          <DashboardCard 
            title="Documents" 
            description="Upload and share documents"
            icon={<Newspaper className="w-8 h-8" />}
            linkTo="/admin/documents"
            linkText="Manage Documents"
          />
          <DashboardCard 
            title="Discount Codes" 
            description="Create and manage promo codes"
            icon={<Tag className="w-8 h-8" />}
            linkTo="/admin/discounts"
            linkText="Manage Discounts"
          />
          <DashboardCard 
            title="Reviews" 
            description="Approve and manage reviews"
            icon={<MessageSquareIcon className="w-8 h-8" />}
            linkTo="/admin/reviews"
            linkText="Manage Reviews"
          />
          <DashboardCard 
            title="Change Password" 
            description="Update your administrator credentials"
            icon={<LockIcon className="w-8 h-8" />}
            linkTo="/admin/password"
            linkText="Update Password"
          />
          <DashboardCard 
            title="Database Export" 
            description="Download your entire database as SQL"
            icon={<DatabaseIcon className="w-8 h-8" />}
            linkTo="/admin/database-export"
            linkText="Export Database"
          />
        </div>
      </main>
    </AdminLayout>
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
