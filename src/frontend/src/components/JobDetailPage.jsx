import { useState, useEffect } from 'react'
import { getJobById, applyToJob } from '../api/jobs'

function formatSalary(min, max) {
  if (min && max) {
    return `$${min.toLocaleString()} – $${max.toLocaleString()}`
  }
  if (min) {
    return `From $${min.toLocaleString()}`
  }
  if (max) {
    return `Up to $${max.toLocaleString()}`
  }
  return null
}

function formatHours(min, max) {
  if (min && max) {
    return `${min} – ${max} hrs / week`
  }
  if (max) {
    return `Up to ${max} hrs / week`
  }
  if (min) {
    return `At least ${min} hrs / week`
  }
  return null
}

function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return null
  }
}

function JobDetailPage({
  token,
  jobId,
  onNavigateJobs,
  onNavigateDashboard,
  onLogout,
  isLoggingOut = false,
}) {
  const [jobState, setJobState] = useState({ id: null, job: null, isLoading: true, error: '' })
  const [isApplying, setIsApplying] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [applySuccess, setApplySuccess] = useState('')

  const job = jobState.id === jobId ? jobState.job : null
  const isLoading = jobState.id !== jobId || jobState.isLoading
  const loadError = jobState.id === jobId ? jobState.error : ''

  useEffect(() => {
    let isMounted = true
    getJobById(jobId)
      .then((data) => {
        if (isMounted) {
          setJobState({ id: jobId, job: data, isLoading: false, error: '' })
        }
      })
      .catch((err) => {
        if (isMounted) {
          setJobState({ id: jobId, job: null, isLoading: false, error: err.message })
        }
      })

    return () => {
      isMounted = false
    }
  }, [jobId])

  async function handleApply() {
    if (!job) return
    setIsApplying(true)
    setApplyError('')
    setApplySuccess('')
    try {
      await applyToJob(token, job.id)
      setApplySuccess('Application submitted successfully!')
    } catch (err) {
      setApplyError(err.message)
    } finally {
      setIsApplying(false)
    }
  }

  const salaryDisplay = job ? formatSalary(job.salary_min, job.salary_max) : null
  const hoursDisplay = job ? formatHours(job.min_hours_per_week, job.max_hours_per_week) : null
  const postedDisplay = job ? formatDate(job.posted_at) : null

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Navigation Bar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <a
              href="/dashboard"
              onClick={(e) => {
                if (onNavigateDashboard) {
                  e.preventDefault()
                  onNavigateDashboard()
                }
              }}
              className="text-xl font-bold text-gray-900 cursor-pointer"
            >
              Career<span className="text-purple-600">Connect</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            {onNavigateJobs && (
              <a
                href="/jobs"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigateJobs()
                }}
                className="text-sm font-medium text-purple-600 hover:underline cursor-pointer"
              >
                Browse Jobs
              </a>
            )}

            {onNavigateDashboard && (
              <a
                href="/dashboard"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigateDashboard()
                }}
                className="text-sm font-medium text-purple-600 hover:underline cursor-pointer"
              >
                Dashboard
              </a>
            )}

            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <a
            href="/jobs"
            onClick={(e) => {
              e.preventDefault()
              if (onNavigateJobs) onNavigateJobs()
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:underline cursor-pointer"
          >
            ← Back to Jobs
          </a>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-xs">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">Loading job posting…</p>
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-dashed border-red-300 bg-red-50/50 p-12 text-center shadow-xs">
            <p className="text-base font-semibold text-red-800">{loadError}</p>
            <p className="mt-1 text-sm text-red-600">The requested job posting may have expired or does not exist.</p>
            <a
              href="/jobs"
              onClick={(e) => {
                e.preventDefault()
                if (onNavigateJobs) onNavigateJobs()
              }}
              className="mt-4 inline-block rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
            >
              Back to Job Listings
            </a>
          </div>
        ) : job ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:p-10">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-purple-600">
                  {job.company_name}
                </span>
                <span className="text-gray-300">•</span>
                <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-700">
                  {job.category}
                </span>
                {postedDisplay && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">Posted {postedDisplay}</span>
                  </>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {job.title}
              </h1>
              <p className="text-sm text-gray-600">{job.location}</p>
            </div>

            {/* Specifications Grid */}
            <div className="my-6 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-3 sm:p-6">
              <div>
                <p className="text-xs font-medium text-gray-500">Job Type</p>
                <p className="text-sm font-semibold text-gray-900">{job.job_type || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Schedule</p>
                <p className="text-sm font-semibold text-gray-900">{job.job_schedule || '—'}</p>
              </div>
              {salaryDisplay && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Compensation</p>
                  <p className="text-sm font-semibold text-gray-900">{salaryDisplay}</p>
                </div>
              )}
              {hoursDisplay && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Work Hours</p>
                  <p className="text-sm font-semibold text-gray-900">{hoursDisplay}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500">Location</p>
                <p className="text-sm font-semibold text-gray-900">{job.location || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Category</p>
                <p className="text-sm font-semibold text-gray-900">{job.category || '—'}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3 border-b border-gray-100 pb-8">
              <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
              <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                {job.description}
              </div>
            </div>

            {/* Application Section */}
            <div className="pt-6">
              {applySuccess && (
                <p className="mb-4 rounded-md bg-green-50 p-4 text-sm font-medium text-green-700">
                  {applySuccess}
                </p>
              )}
              {applyError && (
                <p className="mb-4 rounded-md bg-red-50 p-4 text-sm font-medium text-red-700">
                  {applyError}
                </p>
              )}

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isApplying || Boolean(applySuccess)}
                  className="rounded-md bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {applySuccess ? 'Applied' : isApplying ? 'Applying…' : 'Apply Now'}
                </button>

                <a
                  href="/jobs"
                  onClick={(e) => {
                    e.preventDefault()
                    if (onNavigateJobs) onNavigateJobs()
                  }}
                  className="text-sm font-medium text-gray-600 hover:underline cursor-pointer"
                >
                  Back to Jobs
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default JobDetailPage
