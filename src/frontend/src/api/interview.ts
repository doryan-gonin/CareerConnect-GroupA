import { apiRequest, type ApiRequestOptions } from "./client";
import type { InterviewMessage, InterviewSession, InterviewSessionSummary } from "./types";

async function request<T>(
  token: string,
  path: string,
  fallbackError: string,
  options: Omit<ApiRequestOptions, "token" | "fallbackError"> = {},
): Promise<T> {
  return apiRequest<T>(`/api/interview${path}`, { ...options, token, fallbackError });
}

export function getInterviewSessions(token: string): Promise<InterviewSessionSummary[]> {
  return request<InterviewSessionSummary[]>(
    token,
    "/sessions",
    "Failed to load interview sessions.",
  );
}

export function getInterviewSession(token: string, sessionId: number): Promise<InterviewSession> {
  return request<InterviewSession>(token, `/sessions/${sessionId}`, "Failed to load this session.");
}

export function createInterviewSession(
  token: string,
  applicationId: number,
): Promise<InterviewSession> {
  return request<InterviewSession>(token, "/sessions", "Failed to start the session.", {
    method: "POST",
    body: { application_id: applicationId },
  });
}

export function sendInterviewMessage(
  token: string,
  sessionId: number,
  content: string,
): Promise<InterviewMessage> {
  return request<InterviewMessage>(
    token,
    `/sessions/${sessionId}/messages`,
    "Failed to send your message.",
    {
      method: "POST",
      body: { content },
    },
  );
}
