import { API_BASE_URL } from './client'

// Handles API communication for AI interview preparation sessions.

function extractErrorMessage(body, fallback) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }
  return fallback
}

async function request(token, path, fallbackError, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/interview${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
  } catch {
    throw new Error('Could not reach the server. Is the backend running?')
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, fallbackError))
  }

  return body
}

export function getInterviewSessions(token) {
  return request(token, '/sessions', 'Failed to load interview sessions.')
}

export function getInterviewSession(token, sessionId) {
  return request(token, `/sessions/${sessionId}`, 'Failed to load this session.')
}

export function createInterviewSession(token, applicationId) {
  return request(token, '/sessions', 'Failed to start the session.', {
    method: 'POST',
    body: JSON.stringify({ application_id: applicationId }),
  })
}

export function sendInterviewMessage(token, sessionId, content) {
  return request(token, `/sessions/${sessionId}/messages`, 'Failed to send your message.', {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}
