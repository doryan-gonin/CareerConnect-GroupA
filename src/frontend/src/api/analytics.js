import { apiRequest } from './client'

// Handles API communication for the job seeker's analytics.

export async function getAnalytics(token, endpoint, params) {
  const query = new URLSearchParams(params).toString()
  return apiRequest(`/api/analytics/${endpoint}?${query}`, { token, fallbackError: 'Failed to load analytics.' })
}
