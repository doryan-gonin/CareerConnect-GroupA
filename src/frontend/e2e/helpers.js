import { expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

export const API = 'http://127.0.0.1:8765/api'
export const PASSWORD = 'TestPass123!'

export async function json(response) {
  expect(response.ok(), await response.text()).toBeTruthy()
  return response.json()
}

export async function createUser(request, isRecruiter = false) {
  const email = `e2e-${randomUUID()}@example.com`
  await json(await request.post(`${API}/auth/register`, {
    data: { email_address: email, password: PASSWORD, is_recruiter: isRecruiter },
  }))
  const auth = await json(await request.post(`${API}/auth/login`, {
    data: { email_address: email, password: PASSWORD },
  }))
  return { email, headers: { Authorization: `Bearer ${auth.access_token}` } }
}

export async function login(page, user) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible()
}

export async function createJob(request, recruiter, overrides = {}) {
  return json(await request.post(`${API}/jobs`, {
    headers: recruiter.headers,
    data: {
      title: `Frontend Engineer ${randomUUID()}`,
      company_name: 'CareerConnect Labs',
      description: 'Build accessible React experiences.',
      location: 'Montreal, QC',
      category: 'Software Engineering',
      salary_min: 70000, salary_max: 90000,
      min_hours_per_week: 35, max_hours_per_week: 40,
      ...overrides,
    },
  }))
}

export async function createResume(request, candidate) {
  return json(await request.post(`${API}/profiles/me/resumes`, {
    headers: candidate.headers,
    multipart: { file: { name: 'resume.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF') } },
  }))
}

export async function createApplication(request, candidate, job) {
  const resume = await createResume(request, candidate)
  return json(await request.post(`${API}/jobs/${job.id}/apply`, {
    headers: candidate.headers, data: { resume_id: resume.id },
  }))
}

export async function notifications(request, user) {
  return json(await request.get(`${API}/notifications`, { headers: user.headers }))
}
