import { apiRequest } from "./client";
import type { AnalyticsGranularity, AnalyticsResponse, AnalyticsResponseByEndpoint } from "./types";

export type AnalyticsEndpoint = keyof AnalyticsResponseByEndpoint;

export type AnalyticsParams = Record<string, string | number | boolean | undefined | null>;

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Analytics response was not an object.");
  }
  return Object.fromEntries(Object.entries(value));
}

function requiredString(record: RecordValue, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Analytics response is missing a valid ${key}.`);
  }
  return value;
}

function requiredNumber(record: RecordValue, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Analytics response is missing a valid ${key}.`);
  }
  return value;
}

function nullableNumber(record: RecordValue, key: string): number | null {
  const value = record[key];
  if (value === null || value === undefined) return null;
  return requiredNumber(record, key);
}

function requiredGranularity(record: RecordValue): AnalyticsGranularity {
  const value = record.group_by;
  if (value !== "day" && value !== "week" && value !== "month") {
    throw new Error("Analytics response is missing a valid group_by.");
  }
  return value;
}

function parseTrendResponse(record: RecordValue): AnalyticsResponseByEndpoint["applications"] {
  const points = record.points;
  if (!Array.isArray(points)) throw new Error("Analytics response is missing points.");
  return {
    start_date: requiredString(record, "start_date"),
    end_date: requiredString(record, "end_date"),
    group_by: requiredGranularity(record),
    points: points.map((point) => {
      const parsed = asRecord(point);
      return {
        period: requiredString(parsed, "period"),
        count: requiredNumber(parsed, "count"),
      };
    }),
  };
}

function parseViewResponse(record: RecordValue): AnalyticsResponseByEndpoint["views"] {
  const points = record.points;
  if (!Array.isArray(points)) throw new Error("Analytics response is missing points.");
  return {
    start_date: requiredString(record, "start_date"),
    end_date: requiredString(record, "end_date"),
    group_by: requiredGranularity(record),
    points: points.map((point) => {
      const parsed = asRecord(point);
      return {
        period: requiredString(parsed, "period"),
        unique_postings: requiredNumber(parsed, "unique_postings"),
      };
    }),
  };
}

function parseSalaryResponse(
  record: RecordValue,
): AnalyticsResponseByEndpoint["salary-distribution"] {
  return {
    start_date: requiredString(record, "start_date"),
    end_date: requiredString(record, "end_date"),
    salary_count: requiredNumber(record, "salary_count"),
    average_salary: nullableNumber(record, "average_salary"),
    minimum_salary: nullableNumber(record, "minimum_salary"),
    maximum_salary: nullableNumber(record, "maximum_salary"),
    standard_deviation: nullableNumber(record, "standard_deviation"),
  };
}

function parseSummaryResponse(
  record: RecordValue,
): AnalyticsResponseByEndpoint["application-summary"] {
  const category = record.category;
  const location = record.location;
  if (category !== null && category !== undefined && typeof category !== "string") {
    throw new Error("Analytics response has an invalid category.");
  }
  if (location !== null && location !== undefined && typeof location !== "string") {
    throw new Error("Analytics response has an invalid location.");
  }
  return {
    start_date: requiredString(record, "start_date"),
    end_date: requiredString(record, "end_date"),
    category: category ?? null,
    category_count: requiredNumber(record, "category_count"),
    location: location ?? null,
    location_count: requiredNumber(record, "location_count"),
  };
}

function parseAnalyticsResponse(endpoint: AnalyticsEndpoint, value: unknown): AnalyticsResponse {
  const record = asRecord(value);
  switch (endpoint) {
    case "applications":
    case "searches":
      return parseTrendResponse(record);
    case "views":
      return parseViewResponse(record);
    case "salary-distribution":
      return parseSalaryResponse(record);
    case "application-summary":
      return parseSummaryResponse(record);
  }
}

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
  const body = await apiRequest<unknown>(`/api/analytics/${endpoint}?${query.toString()}`, {
    token,
    fallbackError: "Failed to load analytics.",
  });
  return parseAnalyticsResponse(endpoint, body);
}
