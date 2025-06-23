// Auth helper for admin session (uses HTTP-only cookies from the server)

// Use this in fetch calls to ensure cookies are sent
export function getAuthFetchOptions(): RequestInit {
  return {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  };
}