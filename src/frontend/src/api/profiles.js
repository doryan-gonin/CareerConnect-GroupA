// Handles API communication for user profiles and resume management.

function extractErrorMessage(body, fallback) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }
  return fallback
}

export async function getProfile(token) {
  let response
  try {
    response = await fetch('/api/profiles/me', {
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
    throw new Error(extractErrorMessage(body, 'Failed to load profile.'))
  }

  return body
}

export async function updateProfile(token, { firstName, lastName }) {
  let response
  try {
    response = await fetch('/api/profiles/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
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
    throw new Error(extractErrorMessage(body, 'Failed to update profile.'))
  }

  return body
}

export async function getResumes(token) {
  let response
  try {
    response = await fetch('/api/profiles/me/resumes', {
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
    throw new Error(extractErrorMessage(body, 'Failed to load resumes.'))
  }

  return body || []
}

export async function uploadResume(token, file, makeDefault = false) {
  const formData = new FormData()
  formData.append('file', file)

  const url = `/api/profiles/me/resumes?make_default=${Boolean(makeDefault)}`

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
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
    throw new Error(extractErrorMessage(body, 'Failed to upload resume.'))
  }

  return body
}

export async function setDefaultResume(token, resumeId) {
  let response
  try {
    response = await fetch(`/api/profiles/me/resumes/${resumeId}/default`, {
      method: 'PATCH',
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
    throw new Error(extractErrorMessage(body, 'Failed to set default resume.'))
  }

  return body
}

export async function downloadResume(token, resumeId, fileName = 'resume.pdf') {
  let response
  try {
    response = await fetch(`/api/profiles/me/resumes/${resumeId}`, {
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
    throw new Error(extractErrorMessage(body, 'Could not download resume.'))
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export async function deleteResume(token, resumeId) {
  let response
  try {
    response = await fetch(`/api/profiles/me/resumes/${resumeId}`, {
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
    throw new Error(extractErrorMessage(body, 'Failed to delete resume.'))
  }

  return true
}
