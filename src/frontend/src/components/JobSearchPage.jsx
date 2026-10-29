import { useState } from 'react'
import JobSearchPageNavbar from './JobSearchPageNavbar'
import { applyToJob } from '../api/jobs'

function JobSearchPage({ token, onLogout, isLoggingOut, onNavigateDashboard }) {
    const [jobs, setJobs] = useState([])
    const [hasLoaded, setHasLoaded] = useState(false)
    const [selectedJob, setSelectedJob] = useState(null)
    const [pagination, setPagination] = useState(null)
    const [isApplying, setIsApplying] = useState(false)
    const [applyError, setApplyError] = useState('')
    const [applySuccess, setApplySuccess] = useState('')

    function handleSelectJob(job) {
        setSelectedJob(job)
        setApplyError('')
        setApplySuccess('')
    }

    function handleJobsLoaded(loadedJobs, paginationInfo) {
        setJobs(loadedJobs)
        setHasLoaded(true)
        if (paginationInfo) {
            setPagination(paginationInfo)
        }
        setSelectedJob((prevSelected) => {
            if (!prevSelected) return null
            const stillExists = loadedJobs.find((j) => j.id === prevSelected.id)
            if (!stillExists) {
                setApplyError('')
                setApplySuccess('')
                return null
            }
            return stillExists
        })
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

    function handleReset() {
        setSelectedJob(null)
        setApplyError('')
        setApplySuccess('')
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <JobSearchPageNavbar
                onJobsLoaded={handleJobsLoaded}
                onReset={handleReset}
                onLogout={onLogout}
                isLoggingOut={isLoggingOut}
                onNavigateDashboard={onNavigateDashboard}
            />
            <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
                <div className="flex flex-col gap-3">
                    {!hasLoaded && (
                        <p className="text-sm text-gray-500">Loading jobs…</p>
                    )}
                    {hasLoaded && jobs.length === 0 && (
                        <p className="text-sm text-gray-500">No jobs found matching your search.</p>
                    )}
                    {jobs.map((job) => (
                        <button
                            key={job.id}
                            type="button"
                            onClick={() => handleSelectJob(job)}
                            className={`group block w-100 rounded-xl border p-4 text-left transition hover:border-purple-300 hover:shadow-xs ${
                                selectedJob?.id === job.id
                                    ? 'border-purple-500 bg-purple-50/30'
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            <h2 className='group-hover:text-purple-600 group-hover:underline font-semibold'>{job.title}</h2>
                            <p>{job.company_name}</p>
                            <p>{job.job_schedule}</p>
                            <p>{job.location}</p>
                        </button>
                    ))}

                    {/* Pagination Controls */}
                    {pagination && pagination.total > 0 && (
                        <div className="mt-2 flex flex-col gap-2 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 text-center">
                                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} jobs
                            </p>
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-1">
                                    <button
                                        type="button"
                                        disabled={pagination.page <= 1}
                                        onClick={() => pagination.onPageChange(pagination.page - 1)}
                                        className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Previous
                                    </button>

                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
                                        if (
                                            pagination.totalPages > 7 &&
                                            p !== 1 &&
                                            p !== pagination.totalPages &&
                                            Math.abs(p - pagination.page) > 1
                                        ) {
                                            if (p === 2 || p === pagination.totalPages - 1) {
                                                return <span key={p} className="px-1 text-xs text-gray-400">…</span>
                                            }
                                            return null
                                        }

                                        const isActive = p === pagination.page
                                        return (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => pagination.onPageChange(p)}
                                                className={`min-w-7 rounded-md px-2 py-1 text-xs font-medium transition ${
                                                    isActive
                                                        ? 'bg-purple-600 text-white'
                                                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    })}

                                    <button
                                        type="button"
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => pagination.onPageChange(pagination.page + 1)}
                                        className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
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

