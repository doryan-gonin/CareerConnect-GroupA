import { useState } from 'react'
import JobSearchPageNavbar from './JobSearchPageNavbar'
import { applyToJob } from '../api/jobs'

function JobSearchPage({ token, userEmail, onLogout, isLoggingOut, onNavigateDashboard }) {
    const [jobs, setJobs] = useState([])
    const [selectedJob, setSelectedJob] = useState(null)
    const [isApplying, setIsApplying] = useState(false)
    const [applyError, setApplyError] = useState('')
    const [applySuccess, setApplySuccess] = useState('')

    function handleSelectJob(job) {
        setSelectedJob(job)
        setApplyError('')
        setApplySuccess('')
    }

    async function handleApply() {
        if (!selectedJob) return
        setIsApplying(true)
        setApplyError('')
        setApplySuccess('')
        try {
            await applyToJob(token, selectedJob.id)
            setApplySuccess('Application submitted successfully!')
        } catch (err) {
            setApplyError(err.message)
        } finally {
            setIsApplying(false)
        }
    }

    return (
        <div>
            <JobSearchPageNavbar
                onJobsLoaded={setJobs}
                userEmail={userEmail}
                onLogout={onLogout}
                isLoggingOut={isLoggingOut}
                onNavigateDashboard={onNavigateDashboard}
            />
            <div className="mx-auto flex max-w-6xl gap-6 px-20 py-6">
                <div className="flex flex-col gap-3">
                    {jobs.length === 0 && (
                        <p className="text-sm text-gray-500">Search for a job above to see results.</p>
                    )}
                    {jobs.map((job) => (
                        <button
                            key={job.id}
                            type="button"
                            onClick={() => handleSelectJob(job)}
                            className="group block w-100 rounded-xl border border-gray-200 bg-white p-4 text-left"
                        >
                            <h2 className='group-hover:text-purple-600 group-hover:underline font-semibold'>{job.title}</h2>
                            <p>{job.company_name}</p>
                            <p>{job.job_schedule}</p>
                            <p>{job.location}</p>


                        </button>
                    ))}
                </div>
                <div className="flex-1">
                    {selectedJob && (
                        <div className="group block rounded-xl border border-gray-200 bg-white p-4 text-left">
                            <h2 className="font-semibold text-lg">{selectedJob.title}</h2>
                            <p>Company: {selectedJob.company_name}</p>
                            <p>Location: {selectedJob.location}</p>
                            <p>Category: {selectedJob.category}</p>
                            <p>Type: {selectedJob.job_type} · {selectedJob.job_schedule}</p>
                            {(selectedJob.salary_min || selectedJob.salary_max) && (
                                <p>
                                    Salary: {selectedJob.salary_min ?? '?'} - {selectedJob.salary_max ?? '?'}
                                </p>
                            )}
                            <p className="mt-2">Description: {selectedJob.description}</p>

                            {applySuccess && (
                                <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                                    {applySuccess}
                                </p>
                            )}
                            {applyError && (
                                <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {applyError}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={handleApply}
                                disabled={isApplying || Boolean(applySuccess)}
                                className="mt-3 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {applySuccess ? 'Applied' : isApplying ? 'Applying…' : 'Apply'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


export default JobSearchPage

