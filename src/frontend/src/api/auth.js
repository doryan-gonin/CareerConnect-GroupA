import { apiRequest } from './client'

export function registerUser(emailAddress, password, isRecruiter = false) {
  return apiRequest('/api/auth/register', {
    method: 'POST', body: { email_address: emailAddress, password, is_recruiter: isRecruiter },
    fallbackError: 'Something went wrong. Please try again.',
  })
}

export function loginUser(emailAddress, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST', body: { email_address: emailAddress, password },
    fallbackError: 'Something went wrong. Please try again.',
  })
}

export async function logoutUser(token) {
  if (!token) return
  try {
    await apiRequest('/api/auth/logout', { token, method: 'POST' })
  } catch {
    // Local logout must still complete when the backend is unavailable.
  }
}

export function getCurrentUser(token) {
  return apiRequest('/api/auth/me', {
    token, networkError: 'Could not reach the server.', fallbackError: 'Failed to load account information.',
  })
}
