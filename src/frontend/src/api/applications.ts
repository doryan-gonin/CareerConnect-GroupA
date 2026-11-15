import { apiRequest } from "./client";
import type { ApplicationDetail, ApplicationStatus, Application } from "./types";

export function getMyApplications(
  token: string,
  statusFilter?: ApplicationStatus | string,
): Promise<ApplicationDetail[]> {
  const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
  return apiRequest<ApplicationDetail[]>(`/api/applications/me${query}`, {
    token,
    fallbackError: "Failed to load applications.",
  }).then((applications) => applications || []);
}

export function getApplication(token: string, applicationId: number): Promise<ApplicationDetail> {
  return apiRequest<ApplicationDetail>(`/api/applications/${applicationId}`, {
    token,
    fallbackError: "Failed to load application.",
  });
}

export async function withdrawApplication(token: string, applicationId: number): Promise<true> {
  await apiRequest<void>(`/api/applications/${applicationId}`, {
    token,
    method: "DELETE",
    fallbackError: "Failed to withdraw application.",
  });
  return true;
}

export type { Application };
