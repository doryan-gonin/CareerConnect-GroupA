import { API_BASE_URL } from './client'

// Turns a FastAPI error body into one readable string.
// - Most errors look like { detail: "Some message." }
// - Validation errors (422) look like { detail: [{ msg: "...", ... }, ...] }
function extractErrorMessage(body, fallback) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }
  return fallback
}

async function postJson(path, payload) {
  let response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Could not reach the server. Is the backend running?')
  }

  let body = null
  try {
    body = await response.json()
  } catch {
    // No JSON body (e.g. a 204 response) - that's fine.
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, 'Something went wrong. Please try again.'))
  }

  return body
}

export function registerUser(emailAddress, password) {
  return postJson(`${API_BASE_URL}/api/auth/register`, {
    email_address: emailAddress,
    password,
  })
}

export function loginUser(emailAddress, password) {
  return postJson(`${API_BASE_URL}/api/auth/login`, {
    email_address: emailAddress,
    password,
  })
}

export async function logoutUser(token) {
  if (!token) return
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    // Silently handle network errors so client logout isn't blocked
  }
}

export async function getCurrentUser(token) {
  let response

  try {
    response = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error('Could not reach the server.')
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      typeof body?.detail === 'string'
        ? body.detail
        : 'Failed to load account information.'
    )
  }

  return body
}
