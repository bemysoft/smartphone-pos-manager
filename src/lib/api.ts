/**
 * Multi-Tenant API Client & Request Middleware
 * Automatically resolves tenant-id from URL parameter, active session, or localStorage
 * and appends it to headers and request filters for complete multi-tenant isolation.
 */

// Helper to extract tenant ID from URL or Storage or Session
export function getResolvedTenantId(): string {
  if (typeof window === "undefined") return "default";

  try {
    // 1. Check URL query parameters (?tenant=... or ?tenantId=...)
    const urlParams = new URLSearchParams(window.location.search);
    const queryTenant = urlParams.get("tenantId") || urlParams.get("tenant");
    if (queryTenant && queryTenant.trim()) {
      const clean = queryTenant.trim().toLowerCase();
      localStorage.setItem("tenantId", clean);
      return clean;
    }

    // 2. Check localStorage explicit tenantId
    const storedTenant = localStorage.getItem("tenantId");
    if (storedTenant && storedTenant.trim()) {
      return storedTenant.trim().toLowerCase();
    }

    // 3. Check active employee session
    const sessionStr = localStorage.getItem("employee_session");
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session && session.tenantId) {
        return session.tenantId.trim().toLowerCase();
      }
    }

    // 4. Check JWT auth token payload
    const token = localStorage.getItem("authToken");
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload && payload.tenantId) {
          return payload.tenantId.trim().toLowerCase();
        }
      }
    }
  } catch (e) {
    console.warn("Notice parsing tenant from storage/session:", e);
  }

  return "default";
}

// Helper to update active tenant ID globally
export function setActiveTenantId(tenantId: string): void {
  if (typeof window !== "undefined") {
    const clean = tenantId.trim().toLowerCase();
    localStorage.setItem("tenantId", clean);
    
    // Dispatch custom event for real-time reactivity
    window.dispatchEvent(new CustomEvent("tenant-changed", { detail: { tenantId: clean } }));
  }
}

/**
 * Universal apiFetch middleware
 * Automatically injects:
 * - 'x-tenant-id' header
 * - 'authorization: Bearer <token>' header
 * - 'tenantId' query parameter into API URLs if not already present
 */
export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const tenantId = getResolvedTenantId();
  const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  // Clone and augment headers
  const headers = new Headers(init?.headers || {});
  
  if (!headers.has("x-tenant-id")) {
    headers.set("x-tenant-id", tenantId);
  }
  
  if (authToken && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${authToken}`);
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json, text/plain, */*");
  }

  // If input is a URL string starting with /api, ensure tenantId is in query param if useful
  let finalInput = input;
  if (typeof input === "string" && input.startsWith("/api/")) {
    const [path, queryString] = input.split("?");
    const params = new URLSearchParams(queryString || "");
    if (!params.has("tenantId") && !params.has("tenant")) {
      params.set("tenantId", tenantId);
      finalInput = `${path}?${params.toString()}`;
    }
  }

  const modifiedInit: RequestInit = {
    ...init,
    headers
  };

  const isGet = !init?.method || init.method.toUpperCase() === "GET";

  try {
    const response = await fetch(finalInput, modifiedInit);
    return response;
  } catch (error) {
    // If it's a GET request and network briefly dropped (e.g. server reload), perform a quick retry
    if (isGet) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const retryResponse = await fetch(finalInput, modifiedInit);
        return retryResponse;
      } catch (retryError) {
        console.warn(`[API Notice] Request to ${String(input)} unavailable after retry:`, retryError);
        throw retryError;
      }
    }
    console.warn(`[API Notice] Request to ${String(input)} failed:`, error);
    throw error;
  }
};

/**
 * Safely parse JSON from a response, handling non-JSON/HTML fallbacks gracefully without syntax exceptions
 */
export async function safeResponseJson<T = any>(res: Response, fallbackValue: T | null = null): Promise<T | null> {
  if (!res || !res.ok) return fallbackValue;
  const contentType = res.headers.get("content-type");
  if (contentType && !contentType.includes("application/json") && !contentType.includes("text/json")) {
    return fallbackValue;
  }
  try {
    const text = await res.text();
    if (!text || text.trim().startsWith("<")) {
      return fallbackValue;
    }
    return JSON.parse(text) as T;
  } catch (e) {
    return fallbackValue;
  }
}

/**
 * Fetch and safely parse JSON with built-in fallback
 */
export async function fetchJson<T = any>(endpoint: string, init?: RequestInit, fallbackValue: T | null = null): Promise<T | null> {
  try {
    const res = await apiFetch(endpoint, init);
    return await safeResponseJson<T>(res, fallbackValue);
  } catch (e) {
    return fallbackValue;
  }
}

/**
 * Helper JSON API methods with automatic tenant filtering
 */
export async function apiGet<T = any>(endpoint: string, queryParams?: Record<string, any>): Promise<T> {
  let url = endpoint;
  if (queryParams) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        params.set(key, String(val));
      }
    });
    const qs = params.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `GET ${endpoint} returned status ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T = any>(endpoint: string, body?: any): Promise<T> {
  const res = await apiFetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `POST ${endpoint} returned status ${res.status}`);
  }
  return res.json();
}

export async function apiPut<T = any>(endpoint: string, body?: any): Promise<T> {
  const res = await apiFetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `PUT ${endpoint} returned status ${res.status}`);
  }
  return res.json();
}

export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  const res = await apiFetch(endpoint, { method: "DELETE" });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `DELETE ${endpoint} returned status ${res.status}`);
  }
  return res.json();
}
