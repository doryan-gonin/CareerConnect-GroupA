import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerUser, loginUser, logoutUser, getCurrentUser } from './auth'
import { getMyApplications, withdrawApplication } from './applications'
import { createInterviewSession, sendInterviewMessage } from './interview'
import { getAnalytics } from './analytics'
import { searchJobs, applyToJob, getJobById } from './jobs'
import { updateProfile, uploadResume, getResumes, deleteResume } from './profiles'

let fetchMock
beforeEach(() => {
  fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 7 }), { status: 200 }))
})
afterEach(() => vi.restoreAllMocks())
const lastRequest = () => fetchMock.mock.calls.at(-1)

describe('API request contracts', () => {
  it('registers recruiter credentials and logs in using backend field names', async () => {
    await registerUser('ada@example.com', 'Secure!123', true)
    expect(lastRequest()[0]).toBe('http://localhost:8000/api/auth/register')
    expect(JSON.parse(lastRequest()[1].body)).toEqual({ email_address: 'ada@example.com', password: 'Secure!123', is_recruiter: true })
    await loginUser('ada@example.com', 'Secure!123')
    expect(lastRequest()[0]).toBe('http://localhost:8000/api/auth/login')
    expect(JSON.parse(lastRequest()[1].body)).toEqual({ email_address: 'ada@example.com', password: 'Secure!123' })
  })

  it('uses the configured API origin for account loading and tolerates offline logout', async () => {
    await getCurrentUser('token')
    expect(lastRequest()[0]).toBe('/api/auth/me')
    expect(lastRequest()[1].headers.Authorization).toBe('Bearer token')
    fetchMock.mockRejectedValue(new Error('offline'))
    await expect(logoutUser('token')).resolves.toBeUndefined()
  })

  it('encodes application statuses and handles bodyless withdrawal', async () => {
    await getMyApplications('token', 'Under Review')
    expect(lastRequest()[0]).toContain('/api/applications/me?status=Under%20Review')
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(withdrawApplication('token', 12)).resolves.toBe(true)
    expect(lastRequest()[1].method).toBe('DELETE')
  })

  it('sends interview context and messages as JSON', async () => {
    await createInterviewSession('token', 12)
    expect(JSON.parse(lastRequest()[1].body)).toEqual({ application_id: 12 })
    await sendInterviewMessage('token', 4, 'How should I prepare?')
    expect(lastRequest()[0]).toContain('/api/interview/sessions/4/messages')
    expect(JSON.parse(lastRequest()[1].body)).toEqual({ content: 'How should I prepare?' })
  })

  it('encodes analytics date parameters', async () => {
    await getAnalytics('token', 'applications', { start_date: '2026-11-01', group_by: 'week' })
    expect(new URL(lastRequest()[0]).searchParams.get('start_date')).toBe('2026-11-01')
    expect(new URL(lastRequest()[0]).searchParams.get('group_by')).toBe('week')
  })

  it('encodes job filters, pagination and sorting without undefined values', async () => {
    await searchJobs('token', { keyword: 'React & Python', location: 'New York', jobType: 'Contract', jobSchedule: 'Full-time', sortBy: 'salary_max', sortOrder: 'desc', page: 2, limit: 10 })
    const params = new URL(lastRequest()[0]).searchParams
    expect(Object.fromEntries(params)).toEqual({ keyword: 'React & Python', location: 'New York', job_type: 'Contract', job_schedule: 'Full-time', sort_by: 'salary_max', sort_order: 'desc', page: '2', limit: '10' })
  })

  it('submits the selected resume and cover letter', async () => {
    await applyToJob('token', 8, { resumeId: 2, coverLetter: 'Hello!' })
    expect(lastRequest()[0]).toContain('/api/jobs/8/apply')
    expect(JSON.parse(lastRequest()[1].body)).toEqual({ resume_id: 2, cover_letter: 'Hello!' })
  })

  it('preserves cancellation while loading job details', async () => {
    const error = new DOMException('Cancelled', 'AbortError')
    const controller = new AbortController()
    fetchMock.mockRejectedValue(error)
    await expect(getJobById('token', 8, controller.signal)).rejects.toBe(error)
  })

  it('maps profile fields and uploads resumes as FormData', async () => {
    await updateProfile('token', { firstName: 'Ada', lastName: 'Lovelace' })
    expect(JSON.parse(lastRequest()[1].body)).toEqual({ first_name: 'Ada', last_name: 'Lovelace' })
    const file = new File(['pdf'], 'cv.pdf', { type: 'application/pdf' })
    await uploadResume('token', file, true)
    expect(lastRequest()[0]).toContain('make_default=true')
    expect(lastRequest()[1].body.get('file')).toBe(file)
    expect(lastRequest()[1].headers).not.toHaveProperty('Content-Type')
  })

  it('returns an empty resume list for an empty response and handles bodyless delete', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(getResumes('token')).resolves.toEqual([])
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(deleteResume('token', 2)).resolves.toBe(true)
  })

  it.each([
    ['authentication', () => loginUser('a@example.com', 'bad')],
    ['jobs', () => searchJobs('token')],
    ['applications', () => getMyApplications('token')],
    ['profiles', () => getResumes('token')],
    ['interviews', () => createInterviewSession('token', 2)],
    ['analytics', () => getAnalytics('token', 'applications', {})],
  ])('%s exposes backend error messages', async (_name, call) => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'Request rejected.' }), { status: 403 }))
    await expect(call()).rejects.toThrow('Request rejected.')
  })
})
