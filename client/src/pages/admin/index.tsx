import React from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";

export default function AdminIndexPage() {
  const [, navigate] = useLocation();
  
  // Redirect to admin login
  React.useEffect(() => {
    navigate("/admin/login");
  }, [navigate]);
  
  return (
    <>
      <Helmet>
        <title>Admin - Lisbonlovesme</title>
      </Helmet>
      <div className="h-screen flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </>
  );
}