import { useState, useEffect, useCallback } from 'react'
import { getMyApplications, withdrawApplication } from '../api/applications'
import ApplicationStatusBadge from './ApplicationStatusBadge'

const STATUS_OPTIONS = ['Applied', 'Under Review', 'Interview', 'Offered', 'Rejected']

function ApplicationsSection({ token }) {
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const refreshApplications = useCallback(async () => {
    try {
      const data = await getMyApplications(token, statusFilter || undefined)
      setApplications(data)
    } catch (err) {
      setError(err.message)
    }
  }, [token, statusFilter])

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      try {
        const data = await getMyApplications(token, statusFilter || undefined)
        if (isMounted) {
          setApplications(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (token) {
      load()
    }

    return () => {
      isMounted = false
    }
  }, [token, statusFilter])

  async function handleWithdraw(applicationId, jobTitle) {
    if (!window.confirm(`Withdraw your application for "${jobTitle}"?`)) {
      return
    }

    setActionId(applicationId)
    setError('')
    setSuccess('')

    try {
      await withdrawApplication(token, applicationId)
      setSuccess(`Application for "${jobTitle}" withdrawn.`)
      await refreshApplications()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <h2 className="text-lg font-medium text-gray-900">My Applications</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="py-6 text-center text-sm text-gray-500">Loading applications…</div>
      ) : applications.length === 0 ? (
        <div className="rounded-md bg-gray-50 py-6 text-center text-sm text-gray-500">
          {statusFilter ? `No applications with status "${statusFilter}".` : 'No applications submitted yet.'}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {applications.map((application) => {
            const isWorking = actionId === application.id
            return (
              <li key={application.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{application.job_title}</span>
                    <ApplicationStatusBadge status={application.status} />
                  </div>
                  <span className="text-xs text-gray-500">
                    {application.company_name} · {application.location}
                  </span>
                  <span className="text-xs text-gray-400">
                    Applied on {new Date(application.applied_at).toLocaleDateString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleWithdraw(application.id, application.job_title)}
                  disabled={isWorking}
                  className="self-start text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 sm:self-center"
                >
                  Withdraw
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default ApplicationsSection
