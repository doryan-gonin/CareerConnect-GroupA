import { API_BASE_URL } from './client'

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
    response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
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
    response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
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

async function profileSubResourceRequest(path, token, options = {}, fallbackError = 'Request failed.') {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/profiles/me${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Could not reach the server. Is the backend running?')
  }

  if (response.status === 204) return null

  let body = null
  try {
    body = await response.json()
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, fallbackError))
  }

  return body
}

export function addProfileLink(token, { link_type, url }) {
  return profileSubResourceRequest(
    '/links',
    token,
    { method: 'POST', body: JSON.stringify({ link_type, url }) },
    'Failed to add link.'
  )
}

export function deleteProfileLink(token, linkId) {
  return profileSubResourceRequest(`/links/${linkId}`, token, { method: 'DELETE' }, 'Failed to delete link.')
}

export function addProfileLanguage(token, { language, fluency_level }) {
  return profileSubResourceRequest(
    '/languages',
    token,
    { method: 'POST', body: JSON.stringify({ language, fluency_level }) },
    'Failed to add language.'
  )
}

export function deleteProfileLanguage(token, languageId) {
  return profileSubResourceRequest(`/languages/${languageId}`, token, { method: 'DELETE' }, 'Failed to delete language.')
}

export function addProfileEducation(token, payload) {
  return profileSubResourceRequest(
    '/education',
    token,
    { method: 'POST', body: JSON.stringify(payload) },
    'Failed to add education.'
  )
}

export function deleteProfileEducation(token, educationId) {
  return profileSubResourceRequest(`/education/${educationId}`, token, { method: 'DELETE' }, 'Failed to delete education.')
}

export function addProfileExperience(token, payload) {
  return profileSubResourceRequest(
    '/experience',
    token,
    { method: 'POST', body: JSON.stringify(payload) },
    'Failed to add experience.'
  )
}

export function deleteProfileExperience(token, experienceId) {
  return profileSubResourceRequest(`/experience/${experienceId}`, token, { method: 'DELETE' }, 'Failed to delete experience.')
}

export async function getResumes(token) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/profiles/me/resumes`, {
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

  const url = `${API_BASE_URL}/api/profiles/me/resumes?make_default=${Boolean(makeDefault)}`

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
    response = await fetch(`${API_BASE_URL}/api/profiles/me/resumes/${resumeId}/default`, {
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
    response = await fetch(`${API_BASE_URL}/api/profiles/me/resumes/${resumeId}`, {
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
    response = await fetch(`${API_BASE_URL}/api/profiles/me/resumes/${resumeId}`, {
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
