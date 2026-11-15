import { apiRequest } from "./client";
import {
  applicationSchema,
  emptyResponseSchema,
  jobListResponseSchema,
  jobSchema,
  recruiterApplicationSchema,
  savedJobSchema,
} from "./schemas";
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

  return apiRequest(`/api/jobs?${params}`, {
    token,
    fallbackError: "Failed to load jobs.",
    schema: jobListResponseSchema,
  });
}

export function getJobById(
  token: string | null,
  jobId: number,
  signal?: AbortSignal,
): Promise<Job> {
  return apiRequest(`/api/jobs/${jobId}`, {
    token,
    signal,
    fallbackError: "Failed to load job posting.",
    schema: jobSchema,
  });
}

export async function recordJobView(token: string, jobId: number): Promise<void> {
  await apiRequest(`/api/jobs/${jobId}/view`, {
    token,
    method: "POST",
    fallbackError: "Failed to record job view.",
    schema: emptyResponseSchema,
  });
}

export function getSavedJobs(token: string, signal?: AbortSignal): Promise<SavedJob[]> {
  return apiRequest("/api/jobs/saved", {
    token,
    signal,
    fallbackError: "Failed to load saved jobs.",
    schema: savedJobSchema.array(),
  });
}

export function saveJob(token: string, jobId: number): Promise<SavedJob> {
  return apiRequest(`/api/jobs/${jobId}/save`, {
    token,
    method: "POST",
    fallbackError: "Failed to save this job.",
    schema: savedJobSchema,
  });
}

export async function unsaveJob(token: string, jobId: number): Promise<void> {
  await apiRequest(`/api/jobs/${jobId}/save`, {
    token,
    method: "DELETE",
    fallbackError: "Failed to remove this saved job.",
    schema: emptyResponseSchema,
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
    schema: applicationSchema,
  });
}

export function getMyJobs(token: string): Promise<Job[]> {
  return apiRequest("/api/jobs/mine", {
    token,
    fallbackError: "Failed to load recruiter jobs.",
    schema: jobSchema.array(),
  });
}

export function createJob(token: string, jobData: JobCreate): Promise<Job> {
  return apiRequest("/api/jobs", {
    token,
    method: "POST",
    body: jobData,
    fallbackError: "Failed to create job posting.",
    schema: jobSchema,
  });
}

export function updateJob(token: string, jobId: number, jobData: JobUpdate): Promise<Job> {
  return apiRequest(`/api/jobs/${jobId}`, {
    token,
    method: "PUT",
    body: jobData,
    fallbackError: "Failed to update job posting.",
    schema: jobSchema,
  });
}

export function closeJob(token: string, jobId: number): Promise<unknown> {
  return apiRequest(`/api/jobs/${jobId}`, {
    token,
    method: "DELETE",
    fallbackError: "Failed to close job.",
    schema: emptyResponseSchema,
  });
}

export function getJobApplicants(token: string, jobId: number): Promise<RecruiterApplication[]> {
  return apiRequest(`/api/jobs/${jobId}/applications`, {
    token,
    fallbackError: "Failed to load applicants.",
    schema: recruiterApplicationSchema.array(),
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
  return apiRequest(`/api/jobs/${jobId}/applications/${applicationId}/resume`, {
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
    schema: applicationSchema,
  });
}
