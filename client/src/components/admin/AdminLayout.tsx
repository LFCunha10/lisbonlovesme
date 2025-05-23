import React from "react";
import { Helmet } from "react-helmet";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <>
      <Helmet>
        <title>{title} - Lisbonlovesme Admin</title>
      </Helmet>
      {/* Added pt-20 (padding-top) to account for fixed navbar height */}
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </div>
    </>
  );
}