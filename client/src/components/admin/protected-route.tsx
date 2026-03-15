import type { ReactNode } from "react";
import { useAdminSession } from "@/hooks/use-admin-session";

export default function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminSession({ redirectToLogin: true });

  // Show loading while checking authentication
  if (isLoading) {
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
