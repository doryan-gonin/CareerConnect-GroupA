// Shared API configuration and request/error handling for the frontend clients.

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface ErrorDetail {
  msg?: string;
}

export function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .filter((item): item is ErrorDetail => Boolean(item) && typeof item === "object")
      .map((item) => item.msg)
      .filter((message): message is string => Boolean(message));
    if (messages.length > 0) return messages.join(" ");
  }
  return fallback;
}

export interface ApiRequestOptions {
  token?: string | null;
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  fallbackError?: string;
  networkError?: string;
  responseType?: "json" | "blob";
  cache?: RequestCache;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    token,
    method = "GET",
    body,
    signal,
    headers = {},
    fallbackError = "Request failed.",
    networkError = "Could not reach the server. Is the backend running?",
    responseType = "json",
    cache,
  } = options;

  let response: Response;
  try {
    const requestHeaders: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !isFormData && !requestHeaders["Content-Type"]) {
      requestHeaders["Content-Type"] = "application/json";
    }

    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
      signal,
      ...(cache ? { cache } : {}),
    };
    if (body !== undefined) {
      requestInit.body =
        isFormData || typeof body === "string" ? (body as BodyInit) : JSON.stringify(body);
    }
    response = await fetch(`${API_BASE_URL}${path}`, requestInit);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (error && typeof error === "object" && "name" in error && error.name === "AbortError")
      throw error;
    throw new Error(networkError);
  }

  if (response.ok && responseType === "blob") return (await response.blob()) as T;
  const responseBody: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(extractErrorMessage(responseBody, fallbackError));
  return responseBody as T;
}
