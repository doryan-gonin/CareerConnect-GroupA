
import { useEffect, useRef, useState } from 'react'
import {
  getMyJobs,
  closeJob,
  reopenJob,
  getJobApplicants,
  getApplicantResume,
  updateApplicantStatus,
} from '../api/jobs'
import CreateJobForm from './CreateJobForm'
import EditJobForm from './EditJobForm'
import ApplicationStatusBadge from './ApplicationStatusBadge'



export default function RecruiterDashboard({ token }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingJobId, setEditingJobId] = useState(null)

  const [selectedJobId, setSelectedJobId] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [applicantsLoading, setApplicantsLoading] = useState(false)
  const [applicantsError, setApplicantsError] = useState('')

  const [closingJobId, setClosingJobId] = useState(null)
  const applicantRequestId = useRef(0)

  const [openingResumeId, setOpeningResumeId] = useState(null)
  const [resumeError, setResumeError] = useState('')

  const [updatingApplicationId, setUpdatingApplicationId] = useState(null)
  const [statusError, setStatusError] = useState('')
  const [statusSuccess, setStatusSuccess] = useState('')

  // Load the recruiter's jobs, including inactive jobs.
  useEffect(() => {
    let cancelled = false

    async function loadJobs() {
      setLoading(true)
      setError('')

      try {
        const data = await getMyJobs(token)

        if (!cancelled) {
          setJobs(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadJobs()

    return () => {
      cancelled = true
    }
  }, [token])

  const activeJobs = jobs.filter(job => job.is_active)
  const closedJobs = jobs.filter(job => !job.is_active)

  // Add a newly published job to the dashboard.
  function handleJobCreated(newJob) {
    setJobs(previous => [newJob, ...previous])
    setShowCreateForm(false)
    setActionError('')
  }

  // Replace an edited job with the updated backend record.
  function handleJobUpdated(updatedJob) {
    setJobs(previous =>
      previous.map(job =>
        job.id === updatedJob.id ? updatedJob : job
      )
    )

    setEditingJobId(null)
    setActionError('')
  }

  function handleEditClick(jobId) {
    setEditingJobId(previous =>
      previous === jobId ? null : jobId
    )

    setShowCreateForm(false)
  }

  // Close a job using the existing DELETE endpoint.
  async function handleCloseJob(job) {
    if (!job.is_active || closingJobId !== null) {
      return
    }

    const confirmed = window.confirm(
      `Close "${job.title}"?\n\n` +
      'The posting will become inactive, but its record ' +
      'and applications will be preserved.'
    )

    if (!confirmed) {
      return
    }

    setActionError('')
    setClosingJobId(job.id)

    try {
      await closeJob(token, job.id)

      setJobs(previous =>
        previous.map(item =>
          item.id === job.id
            ? { ...item, is_active: false }
            : item
        )
      )

      if (editingJobId === job.id) {
        setEditingJobId(null)
      }
    } catch (err) {
      setActionError(
        `Could not close "${job.title}": ${err.message}`
      )
    } finally {
      setClosingJobId(null)
    }
  }

  
async function handleReopenJob(job) {
  if (job.is_active || closingJobId !== null) {
    return
  }

  const confirmed = window.confirm(
    `Reopen "${job.title}"?\n\n` +
    'The posting will become active and visible to candidates again.'
  )

  if (!confirmed) {
    return
  }

  setActionError('')
  setClosingJobId(job.id)

  try {
    const updatedJob = await reopenJob(token, job.id)

    setJobs(previous =>
      previous.map(item =>
        item.id === job.id ? updatedJob : item
      )
    )
  } catch (err) {
    setActionError(
      `Could not reopen "${job.title}": ${err.message}`
    )
  } finally {
    setClosingJobId(null)
  }
}


  // Open the applicants list for the selected job.

async function handleViewApplicants(jobId) {
  const requestId = ++applicantRequestId.current

  if (selectedJobId === jobId) {
    setSelectedJobId(null)
    setApplicants([])
    setApplicantsError('')
    setApplicantsLoading(false)
    return
  }

  setSelectedJobId(jobId)
  setApplicants([])
  setApplicantsError('')
  setApplicantsLoading(true)

  try {
    const data = await getJobApplicants(token, jobId)

    if (requestId === applicantRequestId.current) {
      setApplicants(data)
    }
  } catch (err) {
    if (requestId === applicantRequestId.current) {
      setApplicantsError(err.message)
    }
  } finally {
    if (requestId === applicantRequestId.current) {
      setApplicantsLoading(false)
    }
  }
}


async function handleViewResume(jobId, applicationId) {
  setResumeError('')
  setOpeningResumeId(applicationId)

  // Open a blank tab immediately so popup blockers do not
  // block the PDF after the asynchronous request.
  const resumeTab = window.open('', '_blank')

  if (resumeTab) {
    resumeTab.opener = null
    resumeTab.document.title = 'Loading Resume'
    resumeTab.document.body.textContent = 'Loading resume...'
  }

  try {
    const blob = await getApplicantResume(
      token,
      jobId,
      applicationId
    )

    const pdfUrl = URL.createObjectURL(
      new Blob([blob], { type: 'application/pdf' })
    )

    if (resumeTab && !resumeTab.closed) {
      resumeTab.location.replace(pdfUrl)
    } else {
      // If the browser blocked the new tab, download instead.
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `application-${applicationId}-resume.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
    }

    // Do not revoke the URL immediately: the PDF viewer
    // may still be loading it.
    window.setTimeout(() => {
      URL.revokeObjectURL(pdfUrl)
    }, 60000)
  } catch (err) {
    if (resumeTab && !resumeTab.closed) {
      resumeTab.close()
    }

    setResumeError(err.message)
  } finally {
    setOpeningResumeId(null)
  }
}


async function handleUpdateApplicationStatus(applicationId, newStatus) {
  setStatusError('')
  setStatusSuccess('')
  setUpdatingApplicationId(applicationId)

  try {
    const updatedApplication = await updateApplicantStatus(
      token,
      applicationId,
      newStatus
    )

    setApplicants((previousApplicants) =>
      previousApplicants.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status: updatedApplication.status,
              updated_at: updatedApplication.updated_at,
            }
          : application
      )
    )

    setStatusSuccess(
      `Application #${applicationId} updated to ${updatedApplication.status}.`
    )
  } catch (error) {
    setStatusError(error.message)
  } finally {
    setUpdatingApplicationId(null)
  }
}


  return (
    <div className="flex flex-col gap-6">
      {/* Dashboard heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Recruiter Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Create jobs, manage postings, and review applicants.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreateForm(previous => !previous)
            setEditingJobId(null)
          }}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
        >
          {showCreateForm ? 'Cancel' : '+ Create Job'}
        </button>
      </div>

      {showCreateForm && (
        <CreateJobForm
          token={token}
          onCreated={handleJobCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Total Jobs
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {jobs.length}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Active Jobs
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {activeJobs.length}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Closed Jobs
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-600">
            {closedJobs.length}
          </p>
        </div>
      </div>

      {/* Global action errors */}
      {actionError && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      {/* Job postings */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="text-lg font-medium text-gray-900">
            My Job Postings
          </h2>
          <span className="text-xs text-gray-500">
            {jobs.length} {jobs.length === 1 ? 'posting' : 'postings'}
          </span>
        </div>

        {loading && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Loading your jobs…
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            You haven't created any job postings yet.
          </div>
        )}

        {!loading && !error && jobs.map(job => (
          <article
            key={job.id}
            className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6 shadow-sm"
          >
            {/* Job header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {job.title}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      job.is_active
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {job.is_active ? 'Active' : 'Closed'}
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {job.company_name} · {job.location} · <span className="text-gray-400">Job ID #{job.id}</span>
                </p>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="my-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3.5 text-xs sm:grid-cols-4">
              <div>
                <span className="text-gray-500">Category:</span>
                <p className="font-medium text-gray-900">{job.category || '—'}</p>
              </div>

              <div>
                <span className="text-gray-500">Job Type:</span>
                <p className="font-medium text-gray-900">{job.job_type || '—'}</p>
              </div>

              <div>
                <span className="text-gray-500">Schedule:</span>
                <p className="font-medium text-gray-900">{job.job_schedule || '—'}</p>
              </div>

              <div>
                <span className="text-gray-500">Work Hours:</span>
                <p className="font-medium text-gray-900">
                  {job.min_hours_per_week != null || job.max_hours_per_week != null
                    ? `${job.min_hours_per_week ?? 'N/A'} – ${job.max_hours_per_week ?? 'N/A'} hrs/wk`
                    : 'N/A'}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-4">
                <span className="text-gray-500">Salary Range:</span>
                <p className="font-medium text-gray-900">
                  {job.salary_min != null || job.salary_max != null
                    ? `$${job.salary_min?.toLocaleString() ?? 'N/A'} – $${job.salary_max?.toLocaleString() ?? 'N/A'} CAD`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Job action buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleEditClick(job.id)}
                className="rounded-md bg-purple-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-white transition hover:bg-purple-700"
              >
                {editingJobId === job.id
                  ? 'Cancel Editing'
                  : 'Edit Job'}
              </button>

              <button
                type="button"
                onClick={() => handleViewApplicants(job.id)}
                className={`rounded-md border px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
                  selectedJobId === job.id
                    ? 'border-purple-300 bg-purple-50 text-purple-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {selectedJobId === job.id
                  ? 'Hide Applicants'
                  : 'View Applicants'}
              </button>

              {job.is_active ? (
                <button
                  type="button"
                  onClick={() => handleCloseJob(job)}
                  disabled={closingJobId !== null}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {closingJobId === job.id ? 'Closing…' : 'Close Job'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleReopenJob(job)}
                  disabled={closingJobId !== null}
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  {closingJobId === job.id ? 'Reopening…' : 'Reopen Job'}
                </button>
              )}
            </div>

            {/* Edit Job form */}
            {editingJobId === job.id && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <EditJobForm
                  key={job.id}
                  token={token}
                  job={job}
                  onUpdated={handleJobUpdated}
                  onCancel={() => setEditingJobId(null)}
                />
              </div>
            )}

            {/* Applicants section */}
            {selectedJobId === job.id && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">
                  Applicants for {job.title}
                </h4>

                {applicantsLoading && (
                  <p className="py-3 text-sm text-gray-500">
                    Loading applicants…
                  </p>
                )}

                {applicantsError && (
                  <p
                    role="alert"
                    className="mb-3 rounded-md bg-red-50 p-2.5 text-xs text-red-700"
                  >
                    {applicantsError}
                  </p>
                )}

                {statusError && (
                  <p
                    role="alert"
                    className="mb-3 rounded-md bg-red-50 p-2.5 text-xs text-red-700"
                  >
                    {statusError}
                  </p>
                )}

                {statusSuccess && (
                  <p
                    role="status"
                    className="mb-3 rounded-md bg-green-50 p-2.5 text-xs text-green-700"
                  >
                    {statusSuccess}
                  </p>
                )}

                {!applicantsLoading &&
                  !applicantsError &&
                  applicants.length === 0 && (
                    <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
                      No applicants yet.
                    </p>
                  )}

                {!applicantsLoading &&
                  !applicantsError &&
                  applicants.map(application => (
                    <div
                      key={application.id}
                      className="mb-3 rounded-md border border-gray-200 bg-white p-3.5 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {application.applicant_name ||
                                `Applicant #${application.applicant_id}`}
                            </span>
                            <ApplicationStatusBadge status={application.status} />
                          </div>

                          {application.applicant_email && (
                            <p className="text-xs text-gray-500">
                              {application.applicant_email}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            Applied on {new Date(application.applied_at).toLocaleDateString()} · Application #{application.id}
                          </p>
                        </div>

                        {/* Manage Application Status */}
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`application-status-${application.id}`}
                            className="text-xs font-medium text-gray-600"
                          >
                            Status:
                          </label>

                          <select
                            id={`application-status-${application.id}`}
                            value={application.status}
                            onChange={(event) =>
                              handleUpdateApplicationStatus(
                                application.id,
                                event.target.value
                              )
                            }
                            disabled={updatingApplicationId !== null}
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Interview">Interview</option>
                            <option value="Offered">Offered</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>

                      {updatingApplicationId === application.id && (
                        <p className="mt-1 text-xs text-gray-500">
                          Updating application status…
                        </p>
                      )}

                      {application.resume_id != null && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-2">
                          <span className="text-xs text-gray-700">
                            📄 {application.resume_name ||
                              `Resume #${application.resume_id}`}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleViewResume(job.id, application.id)
                            }
                            disabled={openingResumeId !== null}
                            className="rounded-md bg-purple-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
                          >
                            {openingResumeId === application.id
                              ? 'Opening…'
                              : 'View Resume'}
                          </button>
                        </div>
                      )}

                      {resumeError && (
                        <p
                          role="alert"
                          className="mt-2 text-xs text-red-600"
                        >
                          {resumeError}
                        </p>
                      )}

                      {application.cover_letter && (
                        <div className="mt-2.5 rounded bg-gray-50 p-2.5">
                          <p className="text-xs font-medium text-gray-700">
                            Cover Letter:
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600">
                            {application.cover_letter}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
