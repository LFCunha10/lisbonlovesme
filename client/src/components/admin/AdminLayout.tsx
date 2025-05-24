import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  MessageSquare,
  Lock,
  LogOut,
  Database,
  CreditCard
} from "lucide-react";
import { Helmet } from "react-helmet";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location] = useLocation();

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    window.location.href = "/admin/login";
  };

  // Navigation items
  const navItems = [
    { href: "/admin", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { href: "/admin/tours", icon: <Map className="w-5 h-5" />, label: "Tours" },
    { href: "/admin/bookings", icon: <CalendarDays className="w-5 h-5" />, label: "Bookings" },
    { href: "/admin/payments", icon: <CreditCard className="w-5 h-5" />, label: "Payments" },
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
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Lisbonlovesme</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin Portal</p>
          </div>
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
                  onClick={handleLogout}
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
          <header className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="p-4 flex items-center justify-between">
              <h1 className="text-xl font-medium text-gray-800 dark:text-white">
                {title || "Admin"}
              </h1>
              <div className="md:hidden">
                {/* Mobile menu button would go here */}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}