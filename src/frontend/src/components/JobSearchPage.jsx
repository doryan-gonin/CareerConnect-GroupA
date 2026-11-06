
import { useEffect, useState } from 'react'
import JobSearchPageNavbar from './JobSearchPageNavbar'

function JobSearchPage({ onApply }) {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  
useEffect(() => {
  let active = true

  async function loadJobs() {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/jobs')

      if (!response.ok) {
        throw new Error('Failed to load jobs.')
      }

      const data = await response.json()

      if (active) {
        setJobs(data.jobs ?? [])
      }
    } catch (err) {
      if (active) {
        setError(err.message)
      }
    } finally {
      if (active) {
        setIsLoading(false)
      }
    }
  }

  loadJobs()

  return () => {
    active = false
  }
}, [])


  return (
    <div>
      <JobSearchPageNavbar />

      <div className="mx-auto flex max-w-6xl gap-6 px-20 py-6">
       <div>
  {isLoading && <p>Loading jobs...</p>}

  {error && (
    <p role="alert" className="text-red-600">
      {error}
    </p>
  )}

  {!isLoading && !error && jobs.length === 0 && (
    <p>No jobs available.</p>
  )}

  {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => setSelectedJob(job)}
              className="group block w-100 rounded-xl border border-gray-200 bg-white p-4 text-left"
            >
              <h2 className="font-semibold group-hover:text-purple-600 group-hover:underline">
                {job.title}
              </h2>
              <p>{job.company_name}</p>
              <p>{job.job_schedule}</p>
              <p>{job.location}</p>
            </button>
          ))}
        </div>

        <div>
          {selectedJob && (
            <div className="block w-100 rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="font-semibold">{selectedJob.title}</h2>
              <p>Company: {selectedJob.company_name}</p>
              <p>Description: {selectedJob.description}</p>

              <button
                type="button"
                onClick={() => onApply?.(selectedJob)}
                disabled={!onApply}
                className="mt-4 rounded-lg bg-purple-600 px-5 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Apply Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobSearchPage
 