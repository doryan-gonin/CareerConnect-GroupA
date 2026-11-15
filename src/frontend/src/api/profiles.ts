import { apiRequest } from "./client";
import type { Profile, ProfileUpdate, Resume } from "./types";

const PROFILE_PATH = "/api/profiles/me";

export function getProfile(token: string): Promise<Profile> {
  return apiRequest<Profile>(PROFILE_PATH, { token, fallbackError: "Failed to load profile." });
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
  });
}

export async function getResumes(token: string): Promise<Resume[]> {
  return (
    (await apiRequest<Resume[] | null>(`${PROFILE_PATH}/resumes`, {
      token,
      fallbackError: "Failed to load resumes.",
    })) || []
  );
}

export function uploadResume(token: string, file: File, makeDefault = false): Promise<Resume> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<Resume>(`${PROFILE_PATH}/resumes?make_default=${Boolean(makeDefault)}`, {
    token,
    method: "POST",
    body,
    fallbackError: "Failed to upload resume.",
  });
}

export function setDefaultResume(token: string, resumeId: number): Promise<Resume> {
  return apiRequest<Resume>(`${PROFILE_PATH}/resumes/${resumeId}/default`, {
    token,
    method: "PATCH",
    fallbackError: "Failed to set default resume.",
  });
}

export async function downloadResume(
  token: string,
  resumeId: number,
  fileName = "resume.pdf",
): Promise<void> {
  const blob = await apiRequest<Blob>(`${PROFILE_PATH}/resumes/${resumeId}`, {
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
  await apiRequest<void>(`${PROFILE_PATH}/resumes/${resumeId}`, {
    token,
    method: "DELETE",
    fallbackError: "Failed to delete resume.",
  });
  return true;
}
