import { apiRequest } from "./client";
import type { AnalyticsResponse } from "./types";

export type AnalyticsEndpoint =
  | "applications"
  | "searches"
  | "views"
  | "salary-distribution"
  | "application-summary"
  | (string & {});

export type AnalyticsParams = Record<string, string | number | boolean | undefined | null>;

export async function getAnalytics(
  token: string,
  endpoint: AnalyticsEndpoint,
  params: AnalyticsParams = {},
): Promise<AnalyticsResponse> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  return apiRequest<AnalyticsResponse>(`/api/analytics/${endpoint}?${query.toString()}`, {
    token,
    fallbackError: "Failed to load analytics.",
  });
}
