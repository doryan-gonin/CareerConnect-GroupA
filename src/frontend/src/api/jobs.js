// Handles API communication for browsing and applying to job postings.

function extractErrorMessage(body, fallback) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }
  return fallback
}

export async function searchJobs({ keyword, location, category, jobType, jobSchedule, sortBy, sortOrder } = {}) {
  const params = new URLSearchParams()
  if (keyword) params.set('keyword', keyword)
  if (location) params.set('location', location)
  if (category) params.set('category', category)
  if (jobType) params.set('job_type', jobType)
  if (jobSchedule) params.set('job_schedule', jobSchedule)
  if (sortBy) params.set('sort_by', sortBy)
  if (sortOrder) params.set('sort_order', sortOrder)

  let response
  try {
    response = await fetch(`/api/jobs?${params.toString()}`)
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

export async function applyToJob(token, jobId, { resumeId, coverLetter } = {}) {
  let response
  try {
    response = await fetch(`/api/jobs/${jobId}/apply`, {
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
