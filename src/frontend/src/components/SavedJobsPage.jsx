import { useEffect, useState } from 'react'
import { getSavedJobs, unsaveJob } from '../api/jobs'
import Navbar from './Navbar'
import SavedJobButton from './SavedJobButton'

function SavedJobsPage({ token, onLogout, isLoggingOut, onNavigateDashboard, onNavigateJobs, onViewJob }) {
  const [savedJobs, setSavedJobs] = useState([])
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')
  const [removingJobId, setRemovingJobId] = useState(null)

  useEffect(() => {
    let active = true
    getSavedJobs(token)
      .then((items) => {
        if (active) {
          setSavedJobs(items)
          setState('ready')
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message)
          setState('error')
        }
      })
    return () => { active = false }
  }, [token])

  async function removeSavedJob(jobId) {
    setError('')
    setRemovingJobId(jobId)
    try {
      await unsaveJob(token, jobId)
      setSavedJobs((items) => items.filter((item) => item.job_id !== jobId))
    } catch (removeError) {
      setError(removeError.message)
    } finally {
      setRemovingJobId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
        onBrowseJobs={onNavigateJobs}
        onDashboard={onNavigateDashboard}
        isRecruiter={false}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Saved jobs</h1>
          <p className="mt-1 text-sm text-gray-600">Keep track of roles you may want to apply to.</p>
        </div>

        {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {state === 'loading' && <p className="text-sm text-gray-500">Loading saved jobs…</p>}
        {state === 'error' && !error && <p className="text-sm text-gray-500">Saved jobs could not be loaded.</p>}
        {state === 'ready' && savedJobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="font-medium text-gray-800">You have no saved jobs yet.</p>
            <p className="mt-1 text-sm text-gray-500">Use the bookmark on a job listing to save it here.</p>
            <button type="button" onClick={onNavigateJobs} className="mt-4 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
              Browse jobs
            </button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {savedJobs.map(({ job_id: jobId, job }) => {
            const inactive = !job.is_active
            return (
              <article key={jobId} className={`rounded-xl border bg-white p-5 shadow-xs ${inactive ? 'border-amber-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{job.title}</h2>
                    <p className="text-sm text-gray-700">{job.company_name}</p>
                  </div>
                  <SavedJobButton
                    isSaved
                    isPending={removingJobId === jobId}
                    onToggle={() => removeSavedJob(jobId)}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">{job.location}</p>
                {inactive ? (
                  <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">This posting is no longer available.</p>
                ) : (
                  <button type="button" onClick={() => onViewJob(jobId)} className="mt-4 text-sm font-medium text-purple-600 hover:underline">View posting</button>
                )}
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default SavedJobsPage
