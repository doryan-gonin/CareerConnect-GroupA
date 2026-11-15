import { apiRequest } from "./client";
import { emptyResponseSchema, tokenResponseSchema, userSchema } from "./schemas";
import type { TokenResponse, User } from "./types";

export function registerUser(
  emailAddress: string,
  password: string,
  isRecruiter = false,
): Promise<User> {
  return apiRequest<User>("/api/auth/register", {
    method: "POST",
    body: { email_address: emailAddress, password, is_recruiter: isRecruiter },
    fallbackError: "Something went wrong. Please try again.",
    schema: userSchema,
  });
}

export function loginUser(emailAddress: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: { email_address: emailAddress, password },
    fallbackError: "Something went wrong. Please try again.",
    schema: tokenResponseSchema,
  });
}

export async function logoutUser(token?: string | null): Promise<void> {
  if (!token) return;
  try {
    await apiRequest("/api/auth/logout", { token, method: "POST", schema: emptyResponseSchema });
  } catch {
    // Local logout must still complete when the backend is unavailable.
  }
}

export function getCurrentUser(token: string): Promise<User> {
  return apiRequest<User>("/api/auth/me", {
    token,
    networkError: "Could not reach the server.",
    fallbackError: "Failed to load account information.",
    schema: userSchema,
  });
}
