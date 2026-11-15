import { apiRequest } from "./client";
import { applicationDetailSchema, emptyResponseSchema } from "./schemas";
import type { ApplicationDetail, ApplicationStatus, Application } from "./types";

export function getMyApplications(
  token: string,
  statusFilter?: ApplicationStatus | string,
  signal?: AbortSignal,
): Promise<ApplicationDetail[]> {
  const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
  return apiRequest(`/api/applications/me${query}`, {
    token,
    signal,
    fallbackError: "Failed to load applications.",
    schema: applicationDetailSchema.array(),
  }).then((applications) => applications || []);
}

export function getApplication(token: string, applicationId: number): Promise<ApplicationDetail> {
  return apiRequest(`/api/applications/${applicationId}`, {
    token,
    fallbackError: "Failed to load application.",
    schema: applicationDetailSchema,
  });
}

export async function withdrawApplication(token: string, applicationId: number): Promise<true> {
  await apiRequest(`/api/applications/${applicationId}`, {
    token,
    method: "DELETE",
    fallbackError: "Failed to withdraw application.",
    schema: emptyResponseSchema,
  });
  return true;
}

export type { Application };
