import { API_BASE_URL } from './client'

// Handles API communication for browsing and applying to job postings.

function extractErrorMessage(body, fallback) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }
  return fallback
}

export async function searchJobs(token, { keyword, location, category, jobType, jobSchedule, sortBy, sortOrder, page, limit } = {}) {
  const params = new URLSearchParams()
  if (keyword) params.set('keyword', keyword)
  if (location) params.set('location', location)
  if (category) params.set('category', category)
  if (jobType) params.set('job_type', jobType)
  if (jobSchedule) params.set('job_schedule', jobSchedule)
  if (sortBy) params.set('sort_by', sortBy)
  if (sortOrder) params.set('sort_order', sortOrder)
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))

  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/jobs?${params.toString()}`, {
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
    throw new Error(extractErrorMessage(body, 'Failed to load jobs.'))
  }

  return body
}

export async function getJobById(token, jobId, signal) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error('Could not reach the server. Is the backend running?')
  }

  let body = null
  try {
    body = await response.json()
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, 'Failed to load job posting.'))
  }

  return body
}

export async function recordJobView(token, jobId) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/view`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error('Could not reach the server. Is the backend running?')
  }

  if (!response.ok) {
    throw new Error('Failed to record job view.')
  }
}

export async function applyToJob(token, jobId, { resumeId, coverLetter } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        resume_id: resumeId ?? null,
        cover_letter: coverLetter ?? null,
      }),
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
    throw new Error(extractErrorMessage(body, 'Failed to submit application.'))
  }

  return body
}
export async function getMyJobs(token) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/mine`, {
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
    // Ignore invalid JSON responses
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, 'Failed to load recruiter jobs.'))
  }

  return body
}
export async function createJob(token, jobData) {
  const response = await fetch(`${API_BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(jobData),
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(body, 'Failed to create job posting.')
    )
  }

  return body
}
export async function updateJob(token, jobId, jobData) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    })
  } catch {
    throw new Error('Could not reach the server. Is the backend running?')
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(body, 'Failed to update job posting.')
    )
  }

  return body
}

export async function closeJob(token, jobId) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error(
      'Could not reach the server. Is the backend running?'
    )
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(body, 'Failed to close job.')
    )
  }

  return body
}

export async function getJobApplicants(token, jobId) {
  let response

  try {
    response = await fetch(
      `${API_BASE_URL}/api/jobs/${jobId}/applications`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
  } catch {
    throw new Error(
      'Could not reach the server. Is the backend running?'
    )
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(body, 'Failed to load applicants.')
    )
  }

  return body
}

export async function reopenJob(token, jobId) {
  return updateJob(token, jobId, {
    is_active: true,
  })
}

export async function getApplicantResume(token, jobId, applicationId) {
  let response

  try {
    response = await fetch(
      `${API_BASE_URL}/api/jobs/${jobId}/applications/${applicationId}/resume`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    )
  } catch {
    throw new Error(
      'Could not reach the server. Is the backend running?'
    )
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(
      extractErrorMessage(body, 'Failed to load applicant resume.')
    )
  }

  return response.blob()
}

export async function updateApplicantStatus(token, applicationId, newStatus) {
  let response

  try {
    response = await fetch(
      `${API_BASE_URL}/api/applications/${applicationId}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    )
  } catch {
    throw new Error('Could not connect to the backend.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(
      extractErrorMessage(body, 'Failed to update application status.')
    )
  }

  return response.json()
}


