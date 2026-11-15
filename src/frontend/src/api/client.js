// Shared API configuration and request/error handling for the frontend clients.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export function extractErrorMessage(body, fallback) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(' ')
  return fallback
}

export async function apiRequest(path, {
  token,
  method = 'GET',
  body,
  signal,
  headers = {},
  fallbackError = 'Request failed.',
  networkError = 'Could not reach the server. Is the backend running?',
  responseType = 'json',
  cache,
} = {}) {
  let response
  try {
    const requestHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    }
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    if (body !== undefined && !isFormData && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json'
    }

    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      ...(body !== undefined ? { body: isFormData || typeof body === 'string' ? body : JSON.stringify(body) } : {}),
      signal,
      ...(cache ? { cache } : {}),
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new Error(networkError)
  }

  if (response.ok && responseType === 'blob') return response.blob()
  const responseBody = await response.json().catch(() => null)
  if (!response.ok) throw new Error(extractErrorMessage(responseBody, fallbackError))
  return responseBody
}
