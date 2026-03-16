import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { adminMeQueryKey, type AdminUser } from "@/lib/admin-session";
import { apiJson } from "@/lib/queryClient";

export function useAdminSession(options?: { redirectToLogin?: boolean }) {
  const [, setLocation] = useLocation();
  const query = useQuery({
    queryKey: adminMeQueryKey,
    queryFn: () => apiJson<AdminUser>("/api/admin/me", { allowUnauthorized: true }),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isAuthenticated = Boolean(query.data?.isAdmin);

  useEffect(() => {
    if (!options?.redirectToLogin) {
      return;
    }

    if (!query.isLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, options?.redirectToLogin, query.isLoading, setLocation]);

  return {
    user: query.data ?? null,
    isAuthenticated,
    isLoading: query.isLoading,
  };
}
