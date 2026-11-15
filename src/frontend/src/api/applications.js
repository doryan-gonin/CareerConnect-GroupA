import { apiRequest } from './client'

// Handles API communication for a job seeker's own applications.

export async function getMyApplications(token, statusFilter) {
  const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''
  return (await apiRequest(`/api/applications/me${query}`, { token, fallbackError: 'Failed to load applications.' })) || []
}

export async function getApplication(token, applicationId) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new Error('Could not reach the server. Is the backend running?')
  }

  let body = null
  try {
    body = await response.json()
  } catch {
    // ignore malformed error bodies
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, 'Failed to load application.'))
  }

  return body
}

export async function withdrawApplication(token, applicationId) {
  await apiRequest(`/api/applications/${applicationId}`, { token, method: 'DELETE', fallbackError: 'Failed to withdraw application.' })
  return true
}
