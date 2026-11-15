import { apiRequest } from './client'

export function searchJobs(token, { keyword, location, category, jobType, jobSchedule, sortBy, sortOrder, page, limit } = {}) {
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

  return apiRequest(`/api/jobs?${params}`, { token, fallbackError: 'Failed to load jobs.' })
}

export function getJobById(token, jobId, signal) {
  return apiRequest(`/api/jobs/${jobId}`, { token, signal, fallbackError: 'Failed to load job posting.' })
}

export async function recordJobView(token, jobId) {
  await apiRequest(`/api/jobs/${jobId}/view`, { token, method: 'POST', fallbackError: 'Failed to record job view.' })
}

export function applyToJob(token, jobId, { resumeId, coverLetter } = {}) {
  return apiRequest(`/api/jobs/${jobId}/apply`, {
    token, method: 'POST', body: { resume_id: resumeId ?? null, cover_letter: coverLetter ?? null },
    fallbackError: 'Failed to submit application.',
  })
}

export function getMyJobs(token) {
  return apiRequest('/api/jobs/mine', { token, fallbackError: 'Failed to load recruiter jobs.' })
}

export function createJob(token, jobData) {
  return apiRequest('/api/jobs', { token, method: 'POST', body: jobData, fallbackError: 'Failed to create job posting.' })
}

export function updateJob(token, jobId, jobData) {
  return apiRequest(`/api/jobs/${jobId}`, { token, method: 'PUT', body: jobData, fallbackError: 'Failed to update job posting.' })
}

export function closeJob(token, jobId) {
  return apiRequest(`/api/jobs/${jobId}`, { token, method: 'DELETE', fallbackError: 'Failed to close job.' })
}

export function getJobApplicants(token, jobId) {
  return apiRequest(`/api/jobs/${jobId}/applications`, { token, fallbackError: 'Failed to load applicants.' })
}

export function reopenJob(token, jobId) {
  return updateJob(token, jobId, { is_active: true })
}

export function getApplicantResume(token, jobId, applicationId) {
  return apiRequest(`/api/jobs/${jobId}/applications/${applicationId}/resume`, {
    token, cache: 'no-store', responseType: 'blob', fallbackError: 'Failed to load applicant resume.',
  })
}

export function updateApplicantStatus(token, applicationId, newStatus) {
  return apiRequest(`/api/applications/${applicationId}/status`, {
    token, method: 'PATCH', body: { status: newStatus },
    networkError: 'Could not connect to the backend.', fallbackError: 'Failed to update application status.',
  })
}
