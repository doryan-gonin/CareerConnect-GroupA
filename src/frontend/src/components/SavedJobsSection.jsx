import { useEffect, useState } from 'react'
import { getSavedJobs, unsaveJob } from '../api/savedJobs'
import BookmarkButton from './BookmarkButton'

// Lists the jobs the user has bookmarked, with the option to open or unsave each one
function SavedJobsSection({ token, onViewJob, onBrowseJobs }) {
  const [savedJobs, setSavedJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    getSavedJobs(token)
      .then((data) => {
        if (isMounted) setSavedJobs(data.saved_jobs)
      })
      .catch((err) => {
        if (isMounted) setError(err.message)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [token])

  async function handleUnsave(jobId) {
    setRemovingId(jobId)
    setError('')
    try {
      await unsaveJob(token, jobId)
      setSavedJobs((prev) => prev.filter((item) => item.job_id !== jobId))
    } catch (err) {
      setError(err.message)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="saved-jobs-section">
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="py-6 text-center text-sm text-gray-500">Loading saved jobs…</div>
      ) : savedJobs.length === 0 ? (
        <div className="rounded-md bg-gray-50 py-6 text-center text-sm text-gray-500">
          No saved jobs yet.{' '}
          {onBrowseJobs && (
            <button
              type="button"
              onClick={onBrowseJobs}
              className="font-medium text-purple-600 hover:text-purple-700 hover:underline"
            >
              Browse jobs
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {savedJobs.map(({ job_id: jobId, saved_at: savedAt, job }) => (
            <li
              key={jobId}
              data-testid="saved-job-item"
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewJob?.(jobId)}
                    className="truncate text-left text-sm font-medium text-gray-900 hover:text-purple-600 hover:underline"
                  >
                    {job.title}
                  </button>
                  {!job.is_active && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      Closed
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {job.company_name} · {job.location}
                </span>
                <span className="text-xs text-gray-400">
                  Saved on {new Date(savedAt).toLocaleDateString()}
                </span>
              </div>

              <BookmarkButton
                isSaved
                disabled={removingId === jobId}
                onToggle={() => handleUnsave(jobId)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SavedJobsSection
