
export async function submitApplication(token, jobId, resumeId) {
  let response

  try {
    response = await fetch(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        resume_id: resumeId,
      }),
    })
  } catch {
    throw new Error('Could not reach the server. Is the backend running?')
  }

  let body = null

  try {
    body = await response.json()
  } catch {
    // Ignore invalid or empty JSON responses
  }

  if (!response.ok) {
    const detail = body?.detail

    if (typeof detail === 'string') {
      throw new Error(detail)
    }

    throw new Error('Failed to submit application.')
  }

  return body
}

export async function getMyApplications(token) {
  const response = await fetch('/api/applications/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === 'string'
        ? data.detail
        : 'Failed to retrieve applications.'
    )
  }

  return data
}

