import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuthFetchOptions } from "@/lib/auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiePrefix = `${name}=`;
  const value = document.cookie
    .split(";")
    .map((cookiePart) => cookiePart.trim())
    .find((cookiePart) => cookiePart.startsWith(cookiePrefix))
    ?.slice(cookiePrefix.length);

  return value ? decodeURIComponent(value) : null;
}

let csrfTokenPromise: Promise<string | null> | null = null;

export async function getCsrfToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh) {
    const cookieToken = getCookie("csrfToken");
    if (cookieToken) {
      return cookieToken;
    }
  }

  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch("/api/csrf-token", {
      ...getAuthFetchOptions(),
    })
      .then(async (response) => {
        await throwIfResNotOk(response);
        const data = await response.json();
        return typeof data?.csrfToken === "string" ? data.csrfToken : null;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
}

function isMutationMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const normalizedMethod = method.toUpperCase();
  const headers = new Headers();
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;

  if (data !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const buildBody = (value: unknown) => {
    if (value === undefined) {
      return undefined;
    }

    if (typeof FormData !== "undefined" && value instanceof FormData) {
      return value;
    }

    if (typeof value === "string") {
      return value;
    }

    return JSON.stringify(value);
  };

  if (isMutationMethod(normalizedMethod)) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      headers.set("CSRF-Token", csrfToken);
    }
  }

  let res = await fetch(url, {
    ...getAuthFetchOptions(),
    method: normalizedMethod,
    headers,
    body: buildBody(data),
  });

  if (isMutationMethod(normalizedMethod) && res.status === 403) {
    const refreshedCsrfToken = await getCsrfToken(true);
    if (refreshedCsrfToken) {
      headers.set("CSRF-Token", refreshedCsrfToken);
      res = await fetch(url, {
        ...getAuthFetchOptions(),
        method: normalizedMethod,
        headers,
        body: buildBody(data),
      });
    }
  }

  await throwIfResNotOk(res);
  return res;
}

export async function apiJson<T>(
  url: string,
  options?: {
    method?: string;
    data?: unknown;
    allowUnauthorized?: boolean;
  },
): Promise<T | null> {
  const method = options?.method ?? "GET";
  const response = await fetch(url, {
    ...getAuthFetchOptions(),
    method,
  });

  if (options?.allowUnauthorized && response.status === 401) {
    return null;
  }

  await throwIfResNotOk(response);
  if (response.status === 204) {
    return null;
  }

  return response.json() as Promise<T>;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      ...getAuthFetchOptions()
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
