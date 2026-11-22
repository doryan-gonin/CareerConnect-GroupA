import { API_BASE_URL } from './client'

// Handles API communication for bookmarking (saving) job postings.

const SAVED_JOBS_URL = `${API_BASE_URL}/api/saved-jobs`

function extractErrorMessage(body, fallback) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }
  return fallback
}

async function request(url, token, { method = 'GET', fallbackError }) {
  let response
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
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

// Returns { total, saved_jobs: [{ id, job_id, saved_at, job }] }, newest first
export function getSavedJobs(token) {
  return request(SAVED_JOBS_URL, token, { fallbackError: 'Failed to load saved jobs.' })
}

// Returns an array of saved job IDs
export function getSavedJobIds(token) {
  return request(`${SAVED_JOBS_URL}/ids`, token, { fallbackError: 'Failed to load saved jobs.' })
}

export function saveJob(token, jobId) {
  return request(`${SAVED_JOBS_URL}/${jobId}`, token, {
    method: 'POST',
    fallbackError: 'Failed to save job.',
  })
}

export function unsaveJob(token, jobId) {
  return request(`${SAVED_JOBS_URL}/${jobId}`, token, {
    method: 'DELETE',
    fallbackError: 'Failed to remove saved job.',
  })
}
