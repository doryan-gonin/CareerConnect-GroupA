import { apiRequest } from './client'

const PROFILE_PATH = '/api/profiles/me'

export function getProfile(token) {
  return apiRequest(PROFILE_PATH, { token, fallbackError: 'Failed to load profile.' })
}

export function updateProfile(token, { firstName, lastName }) {
  return apiRequest(PROFILE_PATH, {
    token, method: 'PUT', body: { first_name: firstName, last_name: lastName },
    fallbackError: 'Failed to update profile.',
  })
}

export async function getResumes(token) {
  return (await apiRequest(`${PROFILE_PATH}/resumes`, { token, fallbackError: 'Failed to load resumes.' })) || []
}

export function uploadResume(token, file, makeDefault = false) {
  const body = new FormData()
  body.append('file', file)
  return apiRequest(`${PROFILE_PATH}/resumes?make_default=${Boolean(makeDefault)}`, {
    token, method: 'POST', body, fallbackError: 'Failed to upload resume.',
  })
}

export function setDefaultResume(token, resumeId) {
  return apiRequest(`${PROFILE_PATH}/resumes/${resumeId}/default`, {
    token, method: 'PATCH', fallbackError: 'Failed to set default resume.',
  })
}

export async function downloadResume(token, resumeId, fileName = 'resume.pdf') {
  const blob = await apiRequest(`${PROFILE_PATH}/resumes/${resumeId}`, {
    token, responseType: 'blob', fallbackError: 'Could not download resume.',
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  try {
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    window.URL.revokeObjectURL(url)
  }
}

export async function deleteResume(token, resumeId) {
  await apiRequest(`${PROFILE_PATH}/resumes/${resumeId}`, { token, method: 'DELETE', fallbackError: 'Failed to delete resume.' })
  return true
}
