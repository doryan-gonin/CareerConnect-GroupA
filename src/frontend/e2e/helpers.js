import { expect } from '@playwright/test'
import { BACKEND_URL } from '../playwright.config.js'

export const PASSWORD = 'E2e@Pass123'

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Creates a user through the API and returns { email, password, token }
export async function createUser(request, { isRecruiter = false } = {}) {
  const email = `${isRecruiter ? 'recruiter' : 'applicant'}-${uniqueSuffix()}@example.com`

  const register = await request.post(`${BACKEND_URL}/api/auth/register`, {
    data: { email_address: email, password: PASSWORD, is_recruiter: isRecruiter },
  })
  expect(register.ok(), await register.text()).toBeTruthy()

  const login = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { email_address: email, password: PASSWORD },
  })
  expect(login.ok(), await login.text()).toBeTruthy()
  const { access_token: token } = await login.json()

  return { email, password: PASSWORD, token }
}

// Creates an active job posting owned by the given recruiter, with a unique title
export async function createJob(request, recruiter, overrides = {}) {
  const title = `E2E Saved Job ${uniqueSuffix()}`
  const response = await request.post(`${BACKEND_URL}/api/jobs`, {
    headers: { Authorization: `Bearer ${recruiter.token}` },
    data: {
      title,
      company_name: 'E2E Corp',
      description: 'A job posting created by the end-to-end test suite.',
      location: 'Montreal, QC',
      category: 'Engineering',
      job_type: 'Permanent',
      job_schedule: 'Full-time',
      salary_min: 60000,
      salary_max: 80000,
      ...overrides,
    },
  })
  expect(response.ok(), await response.text()).toBeTruthy()
  return response.json()
}

export async function closeJob(request, recruiter, jobId) {
  const response = await request.delete(`${BACKEND_URL}/api/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${recruiter.token}` },
  })
  expect(response.ok(), await response.text()).toBeTruthy()
}

export async function getSavedJobIds(request, user) {
  const response = await request.get(`${BACKEND_URL}/api/saved-jobs/ids`, {
    headers: { Authorization: `Bearer ${user.token}` },
  })
  expect(response.ok(), await response.text()).toBeTruthy()
  return response.json()
}

export async function saveJobViaApi(request, user, jobId) {
  const response = await request.post(`${BACKEND_URL}/api/saved-jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${user.token}` },
  })
  expect(response.ok(), await response.text()).toBeTruthy()
}

// Logs in through the real login form and waits for the dashboard
export async function loginViaUi(page, user) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
}

// Opens the job browsing page and narrows the list to a single job by title
export async function searchJobByTitle(page, title) {
  await page.goto('/jobs')
  const search = page.getByPlaceholder('Describe the job you want')
  await search.fill(title)
  await search.press('Enter')
  const card = page.getByTestId('job-card').filter({ hasText: title })
  await expect(card).toHaveCount(1)
  return card
}

export async function openSavedJobsTab(page) {
  await page.goto('/dashboard')
  await page.getByRole('tab', { name: 'Saved Jobs' }).click()
  const section = page.getByTestId('saved-jobs-section')
  await expect(section).toBeVisible()
  await expect(section.getByText('Loading saved jobs…')).toHaveCount(0)
  return section
}
