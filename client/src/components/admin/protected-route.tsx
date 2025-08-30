import { useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";

export default function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/session", {
          credentials: "include",
        });
        
        if (!res.ok) {
          throw new Error("Not authenticated");
        }

        const data = await res.json();
        
        if (data.isAuthenticated && data.isAdmin) {
          setIsAuthenticated(true);
        } else {
          throw new Error("Not authorized");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setLocation("/admin/login");
      }
    };

    checkAuth();
  }, [setLocation]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Render children only if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Return null if not authenticated (will redirect to login)
  return null;
}