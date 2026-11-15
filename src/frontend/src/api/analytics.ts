import { apiRequest } from "./client";
import { analyticsResponseSchemas } from "./schemas";
import type { AnalyticsResponse, AnalyticsResponseByEndpoint } from "./types";

export type AnalyticsEndpoint = keyof AnalyticsResponseByEndpoint;

export type AnalyticsParams = Record<string, string | number | boolean | undefined | null>;

export async function getAnalytics(
  token: string,
  endpoint: "applications" | "searches",
  params?: AnalyticsParams,
): Promise<AnalyticsResponseByEndpoint["applications"]>;
export async function getAnalytics(
  token: string,
  endpoint: "views",
  params?: AnalyticsParams,
): Promise<AnalyticsResponseByEndpoint["views"]>;
export async function getAnalytics(
  token: string,
  endpoint: "salary-distribution",
  params?: AnalyticsParams,
): Promise<AnalyticsResponseByEndpoint["salary-distribution"]>;
export async function getAnalytics(
  token: string,
  endpoint: "application-summary",
  params?: AnalyticsParams,
): Promise<AnalyticsResponseByEndpoint["application-summary"]>;
export async function getAnalytics<E extends AnalyticsEndpoint>(
  token: string,
  endpoint: E,
  params?: AnalyticsParams,
): Promise<AnalyticsResponseByEndpoint[E]>;
export async function getAnalytics(
  token: string,
  endpoint: AnalyticsEndpoint,
  params: AnalyticsParams = {},
): Promise<AnalyticsResponse> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  return apiRequest(`/api/analytics/${endpoint}?${query.toString()}`, {
    token,
    fallbackError: "Failed to load analytics.",
    schema: analyticsResponseSchemas[endpoint],
  });
}
