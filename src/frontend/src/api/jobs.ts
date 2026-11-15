import { apiRequest } from "./client";
import type {
  ApplicationInput,
  ApplicationStatus,
  Job,
  JobCreate,
  JobListResponse,
  JobSortBy,
  JobSortOrder,
  JobUpdate,
  RecruiterApplication,
  SavedJob,
} from "./types";

export interface JobSearchOptions {
  keyword?: string;
  location?: string;
  category?: string;
  jobType?: string;
  jobSchedule?: string;
  sortBy?: JobSortBy | string;
  sortOrder?: JobSortOrder | string;
  aiSuggested?: boolean;
  refreshSuggestions?: boolean;
  page?: number;
  limit?: number;
}

export function searchJobs(
  token: string | null,
  options: JobSearchOptions = {},
): Promise<JobListResponse> {
  const {
    keyword,
    location,
    category,
    jobType,
    jobSchedule,
    sortBy,
    sortOrder,
    aiSuggested,
    refreshSuggestions,
    page,
    limit,
  } = options;
  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  if (location) params.set("location", location);
  if (category) params.set("category", category);
  if (jobType) params.set("job_type", jobType);
  if (jobSchedule) params.set("job_schedule", jobSchedule);
  if (sortBy) params.set("sort_by", sortBy);
  if (sortOrder) params.set("sort_order", sortOrder);
  if (aiSuggested) params.set("ai_suggested", "true");
  if (refreshSuggestions) params.set("refresh_suggestions", "true");
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));

  return apiRequest<JobListResponse>(`/api/jobs?${params}`, {
    token,
    fallbackError: "Failed to load jobs.",
  });
}

export function getJobById(
  token: string | null,
  jobId: number,
  signal?: AbortSignal,
): Promise<Job> {
  return apiRequest<Job>(`/api/jobs/${jobId}`, {
    token,
    signal,
    fallbackError: "Failed to load job posting.",
  });
}

export async function recordJobView(token: string, jobId: number): Promise<void> {
  await apiRequest<void>(`/api/jobs/${jobId}/view`, {
    token,
    method: "POST",
    fallbackError: "Failed to record job view.",
  });
}

export function getSavedJobs(token: string): Promise<SavedJob[]> {
  return apiRequest<SavedJob[]>("/api/jobs/saved", {
    token,
    fallbackError: "Failed to load saved jobs.",
  });
}

export function saveJob(token: string, jobId: number): Promise<SavedJob> {
  return apiRequest<SavedJob>(`/api/jobs/${jobId}/save`, {
    token,
    method: "POST",
    fallbackError: "Failed to save this job.",
  });
}

export async function unsaveJob(token: string, jobId: number): Promise<void> {
  await apiRequest<void>(`/api/jobs/${jobId}/save`, {
    token,
    method: "DELETE",
    fallbackError: "Failed to remove this saved job.",
  });
}

export function applyToJob(
  token: string,
  jobId: number,
  { resumeId, coverLetter }: { resumeId?: number | null; coverLetter?: string | null } = {},
): Promise<import("./types").Application> {
  const body: ApplicationInput = { resume_id: resumeId ?? null, cover_letter: coverLetter ?? null };
  return apiRequest(`/api/jobs/${jobId}/apply`, {
    token,
    method: "POST",
    body,
    fallbackError: "Failed to submit application.",
  });
}

export function getMyJobs(token: string): Promise<Job[]> {
  return apiRequest<Job[]>("/api/jobs/mine", {
    token,
    fallbackError: "Failed to load recruiter jobs.",
  });
}

export function createJob(token: string, jobData: JobCreate): Promise<Job> {
  return apiRequest<Job>("/api/jobs", {
    token,
    method: "POST",
    body: jobData,
    fallbackError: "Failed to create job posting.",
  });
}

export function updateJob(token: string, jobId: number, jobData: JobUpdate): Promise<Job> {
  return apiRequest<Job>(`/api/jobs/${jobId}`, {
    token,
    method: "PUT",
    body: jobData,
    fallbackError: "Failed to update job posting.",
  });
}

export function closeJob(token: string, jobId: number): Promise<unknown> {
  return apiRequest(`/api/jobs/${jobId}`, {
    token,
    method: "DELETE",
    fallbackError: "Failed to close job.",
  });
}

export function getJobApplicants(token: string, jobId: number): Promise<RecruiterApplication[]> {
  return apiRequest<RecruiterApplication[]>(`/api/jobs/${jobId}/applications`, {
    token,
    fallbackError: "Failed to load applicants.",
  });
}

export function reopenJob(token: string, jobId: number): Promise<Job> {
  return updateJob(token, jobId, { is_active: true });
}

export function getApplicantResume(
  token: string,
  jobId: number,
  applicationId: number,
): Promise<Blob> {
  return apiRequest<Blob>(`/api/jobs/${jobId}/applications/${applicationId}/resume`, {
    token,
    cache: "no-store",
    responseType: "blob",
    fallbackError: "Failed to load applicant resume.",
  });
}

export function updateApplicantStatus(
  token: string,
  applicationId: number,
  newStatus: ApplicationStatus | string,
): Promise<import("./types").Application> {
  return apiRequest(`/api/applications/${applicationId}/status`, {
    token,
    method: "PATCH",
    body: { status: newStatus },
    networkError: "Could not connect to the backend.",
    fallbackError: "Failed to update application status.",
  });
}
