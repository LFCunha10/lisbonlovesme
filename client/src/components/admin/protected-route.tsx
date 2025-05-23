import { useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

export default function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem("adminToken");
    
    if (!adminToken || adminToken !== "admin-authenticated") {
      // Redirect to login if not authenticated
      setLocation("/admin/login");
    }
  }, [setLocation]);

  // Render children only if admin is logged in
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  if (!adminToken || adminToken !== "admin-authenticated") {
    return null;
  }

  return <>{children}</>;
}