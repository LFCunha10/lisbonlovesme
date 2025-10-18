import React from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  MessageSquare,
  Lock,
  LogOut,
  Database,
  CreditCard,
  ImageIcon,
  FileText
} from "lucide-react";
import { Helmet } from "react-helmet";


interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {

  const [location, setLocation] = useLocation();

  // Navigation items
  const navItems = [
    { href: "/admin", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { href: "/admin/tours", icon: <Map className="w-5 h-5" />, label: "Tours" },
    { href: "/admin/requests", icon: <MessageSquare className="w-5 h-5" />, label: "Requests" },
    { href: "/admin/bookings", icon: <CalendarDays className="w-5 h-5" />, label: "Bookings" },
    { href: "/admin/payments", icon: <CreditCard className="w-5 h-5" />, label: "Payments" },
    { href: "/admin/articles", icon: <FileText className="w-5 h-5" />, label: "Articles" },
    { href: "/admin/documents", icon: <FileText className="w-5 h-5" />, label: "Documents" },
    { href: "/admin/gallery", icon: <ImageIcon className="w-5 h-5" />, label: "Gallery" },
    { href: "/admin/reviews", icon: <MessageSquare className="w-5 h-5" />, label: "Reviews" },
    { href: "/admin/password", icon: <Lock className="w-5 h-5" />, label: "Password" },
    { href: "/admin/database-export", icon: <Database className="w-5 h-5" />, label: "Database Export" }
  ];

  return (
    <>
      <Helmet>
        <title>{title ? `${title} - Lisbonlovesme Admin` : "Lisbonlovesme Admin"}</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-md hidden md:block">
          <nav className="mt-4">
              <ul>
                {navItems.map((item) => (
                  <li key={item.href} className="mb-1">
                    <Link href={item.href}>
                      <div
                        className={`flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          location === item.href
                            ? "bg-gray-100 dark:bg-gray-700 border-l-4 border-blue-500 dark:border-blue-400"
                            : ""
                        }`}
                      >
                        {item.icon}
                        <span className="ml-3">{item.label}</span>
                      </div>
                    </Link>
                  </li>
                ))}
                <li className="mt-6">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/csrf-token", {
                          credentials: "include",
                        });
                        const data = await res.json();

                        await fetch("/api/admin/logout", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            "CSRF-Token": data.csrfToken,
                          },
                          credentials: "include",
                        });

                        setLocation("/admin/login");
                      } catch (error) {
                        console.error("Logout failed", error);
                      }
                    }}
                    className="flex items-center w-full px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="ml-3">Logout</span>
                  </button>
                </li>
              </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 md:p-10">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
