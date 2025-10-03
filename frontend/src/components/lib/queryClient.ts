import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Helper function to construct the full API URL
// In development, Vite proxy handles /api/* requests
// In production, requests go to same origin
function getApiUrl(path: string): string {
  // If path is already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // For API paths, just return the path as-is
  // Vite proxy will handle /api/* requests in development
  return path;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = getApiUrl(url);
  
  // Get authentication headers from localStorage
  const currentUserStr = localStorage.getItem('currentUser');
  let authHeaders: Record<string, string> = {};
  
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      authHeaders = {
        'X-Username': currentUser.username || '',
        'X-Password': currentUser.password || ''
      };
    } catch (error) {
      console.error('Failed to parse current user:', error);
    }
  }
  
  // Determine headers and body based on data type
  let headers: Record<string, string> = { ...authHeaders };
  let body: string | FormData | undefined;
  
  if (data) {
    if (data instanceof FormData) {
      // For FormData, don't set Content-Type - browser will set it with boundary
      // But still add auth headers
      body = data;
    } else {
      // For JSON data
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/") as string;
    const fullUrl = getApiUrl(path);
    
    // Get authentication headers from localStorage
    const currentUserStr = localStorage.getItem('currentUser');
    let authHeaders: Record<string, string> = {};
    
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        authHeaders = {
          'X-Username': currentUser.username || '',
          'X-Password': currentUser.password || ''
        };
      } catch (error) {
        console.error('Failed to parse current user:', error);
      }
    }
    
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers: authHeaders,
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
