import { apiRequest } from "./client";
import { emptyResponseSchema, profileSchema, resumeSchema } from "./schemas";
import type { Profile, ProfileUpdate, Resume } from "./types";

const PROFILE_PATH = "/api/profiles/me";

export function getProfile(token: string): Promise<Profile> {
  return apiRequest(PROFILE_PATH, {
    token,
    fallbackError: "Failed to load profile.",
    schema: profileSchema,
  });
}

export function updateProfile(
  token: string,
  { firstName, lastName }: { firstName?: string; lastName?: string },
): Promise<Profile> {
  const body: ProfileUpdate = { first_name: firstName, last_name: lastName };
  return apiRequest<Profile>(PROFILE_PATH, {
    token,
    method: "PUT",
    body,
    fallbackError: "Failed to update profile.",
    schema: profileSchema,
  });
}

export async function getResumes(token: string): Promise<Resume[]> {
  return (
    (await apiRequest(`${PROFILE_PATH}/resumes`, {
      token,
      fallbackError: "Failed to load resumes.",
      schema: resumeSchema.array().nullable(),
    })) || []
  );
}

export function uploadResume(token: string, file: File, makeDefault = false): Promise<Resume> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest(`${PROFILE_PATH}/resumes?make_default=${Boolean(makeDefault)}`, {
    token,
    method: "POST",
    body,
    fallbackError: "Failed to upload resume.",
    schema: resumeSchema,
  });
}

export function setDefaultResume(token: string, resumeId: number): Promise<Resume> {
  return apiRequest(`${PROFILE_PATH}/resumes/${resumeId}/default`, {
    token,
    method: "PATCH",
    fallbackError: "Failed to set default resume.",
    schema: resumeSchema,
  });
}

export async function downloadResume(
  token: string,
  resumeId: number,
  fileName = "resume.pdf",
): Promise<void> {
  const blob = await apiRequest(`${PROFILE_PATH}/resumes/${resumeId}`, {
    token,
    responseType: "blob",
    fallbackError: "Could not download resume.",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export async function deleteResume(token: string, resumeId: number): Promise<true> {
  await apiRequest(`${PROFILE_PATH}/resumes/${resumeId}`, {
    token,
    method: "DELETE",
    fallbackError: "Failed to delete resume.",
    schema: emptyResponseSchema,
  });
  return true;
}
