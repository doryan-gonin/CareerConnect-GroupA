// Shared API configuration and request/error handling for the frontend clients.

import { z } from "zod";

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const errorPayloadSchema = z
  .object({
    detail: z
      .union([z.string(), z.array(z.object({ msg: z.string().optional() }).passthrough())])
      .optional(),
  })
  .passthrough();

export function extractErrorMessage(body: unknown, fallback: string): string {
  const parsed = errorPayloadSchema.safeParse(body);
  if (!parsed.success) return fallback;
  const detail = parsed.data.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => item.msg)
      .filter((message): message is string => Boolean(message));
    if (messages.length > 0) return messages.join(" ");
  }
  return fallback;
}

export interface ApiRequestOptions<T = unknown> {
  token?: string | null;
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  fallbackError?: string;
  networkError?: string;
  responseType?: "json" | "blob";
  cache?: RequestCache;
  schema?: z.ZodType<T>;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions<T> & { schema: z.ZodType<T> },
): Promise<T>;
export async function apiRequest(
  path: string,
  options: ApiRequestOptions<Blob> & { responseType: "blob" },
): Promise<Blob>;
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions<T> = {},
): Promise<T | Blob> {
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

  if (response.ok && responseType === "blob") return response.blob();
  const responseBody: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(extractErrorMessage(responseBody, fallbackError));
  if (!options.schema) throw new Error("Response schema is required for JSON API responses.");
  const parsed = options.schema.safeParse(responseBody);
  if (!parsed.success) {
    throw new Error(`Invalid response from ${path}.`);
  }
  return parsed.data;
}
