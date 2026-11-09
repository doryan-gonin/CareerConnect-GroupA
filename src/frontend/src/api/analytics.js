import { API_BASE_URL } from './client'

// Handles API communication for the job seeker's analytics.

function extractErrorMessage(body, fallback) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }
  return fallback
}

export async function getAnalytics(token, endpoint, params) {
  const query = new URLSearchParams(params).toString()

  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/analytics/${endpoint}?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error('Could not reach the server. Is the backend running?')
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, 'Failed to load analytics.'))
  }

  return body
}
