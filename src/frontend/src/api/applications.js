import { apiRequest } from './client'

// Handles API communication for a job seeker's own applications.

export async function getMyApplications(token, statusFilter) {
  const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''
  return (await apiRequest(`/api/applications/me${query}`, { token, fallbackError: 'Failed to load applications.' })) || []
}

export async function withdrawApplication(token, applicationId) {
  await apiRequest(`/api/applications/${applicationId}`, { token, method: 'DELETE', fallbackError: 'Failed to withdraw application.' })
  return true
}
