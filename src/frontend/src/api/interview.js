import { apiRequest } from "./client";

// Handles API communication for AI interview preparation sessions.

async function request(token, path, fallbackError, options = {}) {
  return apiRequest(`/api/interview${path}`, { ...options, token, fallbackError });
}

export function getInterviewSessions(token) {
  return request(token, "/sessions", "Failed to load interview sessions.");
}

export function getInterviewSession(token, sessionId) {
  return request(token, `/sessions/${sessionId}`, "Failed to load this session.");
}

export function createInterviewSession(token, applicationId) {
  return request(token, "/sessions", "Failed to start the session.", {
    method: "POST",
    body: JSON.stringify({ application_id: applicationId }),
  });
}

export function sendInterviewMessage(token, sessionId, content) {
  return request(token, `/sessions/${sessionId}/messages`, "Failed to send your message.", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
