// Auth helper functions for the admin section

// Check if the admin is logged in
export function isAdminLoggedIn(): boolean {
  const adminToken = localStorage.getItem("adminToken");
  return adminToken === "admin-authenticated";
}

// Set admin as logged in
export function loginAdmin(): void {
  localStorage.setItem("adminToken", "admin-authenticated");
}

// Log admin out
export function logoutAdmin(): void {
  localStorage.removeItem("adminToken");
}

// Get authentication headers for API requests
export function getAuthHeaders(): Record<string, string> {
  const adminToken = localStorage.getItem("adminToken");
  return adminToken === "admin-authenticated" 
    ? { "X-Admin-Auth": "admin-authenticated" }
    : {};
}