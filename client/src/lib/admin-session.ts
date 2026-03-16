import type { QueryClient } from "@tanstack/react-query";

export type AdminUser = {
  id: number;
  username: string;
  isAdmin: boolean;
};

export const adminMeQueryKey = ["/api/admin/me"] as const;

export function setAdminSessionUser(queryClient: QueryClient, user: AdminUser | null) {
  queryClient.setQueryData(adminMeQueryKey, user);
}

export function clearAdminSession(queryClient: QueryClient) {
  setAdminSessionUser(queryClient, null);
}
