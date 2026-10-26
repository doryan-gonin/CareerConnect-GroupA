// Handles API communication for a job seeker's own applications.

function extractErrorMessage(body, fallback) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }
  return fallback
}

export async function getMyApplications(token, statusFilter) {
  const url = statusFilter
    ? `/api/applications/me?status=${encodeURIComponent(statusFilter)}`
    : '/api/applications/me'

  let response
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error('Could not reach the server. Is the backend running?')
  }

  let body = null
  try {
    body = await response.json()
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, 'Failed to load applications.'))
  }

  return body || []
}

export async function withdrawApplication(token, applicationId) {
  let response
  try {
    response = await fetch(`/api/applications/${applicationId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error('Could not reach the server. Is the backend running?')
  }

  if (!response.ok) {
    let body = null
    try {
      body = await response.json()
    } catch {
      // ignore
    }
    throw new Error(extractErrorMessage(body, 'Failed to withdraw application.'))
  }

  return true
}
