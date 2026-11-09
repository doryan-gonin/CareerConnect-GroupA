
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
    <div className="mx-auto max-w-6xl px-4 py-8">

      {/* Dashboard heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Recruiter Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Create jobs, manage postings, and review applicants.
        </p>
      </div>

      {/* Create Job */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => {
            setShowCreateForm(previous => !previous)
            setEditingJobId(null)
          }}
          className="rounded-lg bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-700"
        >
          {showCreateForm ? 'Cancel Creating' : '+ Create Job'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-8">
          <CreateJobForm
            token={token}
            onCreated={handleJobCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Statistics */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-bold">
            {jobs.length}
          </h2>
          <p className="mt-2 text-gray-600">Total Jobs</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-bold text-green-600">
            {activeJobs.length}
          </h2>
          <p className="mt-2 text-gray-600">Active Jobs</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-600">
            {closedJobs.length}
          </h2>
          <p className="mt-2 text-gray-600">Closed Jobs</p>
        </div>
      </div>

      {/* Global action errors */}
      {actionError && (
        <p
          role="alert"
          className="mb-5 rounded-lg bg-red-50 p-4 text-red-700"
        >
          {actionError}
        </p>
      )}

      {/* Job postings */}
      <section>
        <h2 className="mb-5 text-2xl font-bold">
          My Job Postings
        </h2>

        {loading && (
          <p className="text-gray-600">
            Loading your jobs...
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="rounded-xl border bg-white p-8 text-center">
            <p className="text-gray-600">
              You haven't created any job postings yet.
            </p>
          </div>
        )}

        {!loading && !error && jobs.map(job => (
          <article
            key={job.id}
            className="mb-5 rounded-xl border bg-white p-6 shadow-sm"
          >
            {/* Job header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {job.title}
                </h3>

                <p className="mt-1 text-gray-600">
                  {job.company_name} — {job.location}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Job ID: {job.id}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  job.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {job.is_active ? 'Active' : 'Closed'}
              </span>
            </div>

            {/* Job details */}
            <div className="mt-5 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
              <p>
                <strong>Category:</strong> {job.category}
              </p>

              <p>
                <strong>Job Type:</strong> {job.job_type}
              </p>

              <p>
                <strong>Schedule:</strong> {job.job_schedule}
              </p>

              <p>
                <strong>Working Hours:</strong>{' '}
                {job.min_hours_per_week ?? 'N/A'} –{' '}
                {job.max_hours_per_week ?? 'N/A'} hours/week
              </p>

              <p>
                <strong>Salary Range:</strong>{' '}
                {job.salary_min != null
                  ? `$${job.salary_min.toLocaleString()}`
                  : 'N/A'}
                {' – '}
                {job.salary_max != null
                  ? `$${job.salary_max.toLocaleString()}`
                  : 'N/A'}
                {' CAD'}
              </p>
            </div>

            {/* Job action buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleEditClick(job.id)}
                className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700"
              >
                {editingJobId === job.id
                  ? 'Cancel Editing'
                  : 'Edit Job'}
              </button>

              <button
                type="button"
                onClick={() => handleViewApplicants(job.id)}
                className="rounded-lg border border-violet-600 px-4 py-2 font-medium text-violet-700 hover:bg-violet-50"
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
    className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
  >
    {closingJobId === job.id ? 'Closing...' : 'Close Job'}
  </button>
) : (
  <button
    type="button"
    onClick={() => handleReopenJob(job)}
    disabled={closingJobId !== null}
    className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
  >
    {closingJobId === job.id ? 'Reopening...' : 'Reopen Job'}
  </button>
)}

              
            </div>

            {/* Edit Job form */}
            {editingJobId === job.id && (
              <div className="mt-5 border-t pt-5">
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
              <div className="mt-6 border-t pt-5">
                <h4 className="mb-4 text-lg font-semibold">
                  Applicants for {job.title}
                </h4>

                {applicantsLoading && (
                  <p className="text-gray-600">
                    Loading applicants...
                  </p>
                )}

              
{applicantsError && (
  <p
    role="alert"
    className="rounded-lg bg-red-50 p-3 text-red-700"
  >
    {applicantsError}
  </p>
)}

{/* Application status update error */}
{statusError && (
  <p
    role="alert"
    className="mb-3 rounded-lg bg-red-50 p-3 text-red-700"
  >
    {statusError}
  </p>
)}

{/* Application status update success */}
{statusSuccess && (
  <p
    role="status"
    className="mb-3 rounded-lg bg-green-50 p-3 text-green-700"
  >
    {statusSuccess}
  </p>
)}

{!applicantsLoading &&
  !applicantsError &&
  applicants.length === 0 && (
    <p className="rounded-lg bg-gray-50 p-4 text-gray-600">
      No applicants yet.
    </p>
  )}


                {!applicantsLoading &&
                  !applicantsError &&
                  applicants.map(application => (
                    <div
                      key={application.id}

                      className="mb-3 rounded-lg border p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
  <h5 className="font-semibold">
    {application.applicant_name ||
      `Applicant #${application.applicant_id}`}
  </h5>

  {application.applicant_email && (
    <p className="mt-1 text-sm text-gray-600">
      {application.applicant_email}
    </p>
  )}
</div>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                          {application.status}
                        </span>
                

                       {/* Manage Application Status */}
  <div className="mt-4">
    <label
      htmlFor={`application-status-${application.id}`}
      className="mb-2 block text-sm font-semibold text-gray-800"
    >
      Manage Application Status
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
      className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
    >
      <option value="Applied">Applied</option>
      <option value="Under Review">Under Review</option>
      <option value="Interview">Interview</option>
      <option value="Offered">Offered</option>
      <option value="Rejected">Rejected</option>
    </select>

    {updatingApplicationId === application.id && (
      <p className="mt-2 text-sm text-gray-500">
        Updating application...
      </p>
    )}
  </div>
</div>

                      <p className="mt-2 text-sm text-gray-600">
                        Application ID: {application.id}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Applied:{' '}
                        {new Date(
                          application.applied_at
                        ).toLocaleDateString()}
                      </p>

                      
{application.resume_id != null && (
  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-4">
    <div>
      <p className="font-medium text-gray-900">
  Submitted Resume
</p>

      <p className="mt-1 text-sm text-gray-600">
        {application.resume_name ||
          `Resume #${application.resume_id}`}
      </p>
    </div>

    <button
      type="button"
      onClick={() =>
        handleViewResume(job.id, application.id)
      }
      disabled={openingResumeId !== null}
      className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
    >
      {openingResumeId === application.id
        ? 'Opening...'
        : 'View Resume'}
    </button>
  </div>
)}


{resumeError && (
  <p
    role="alert"
    className="mb-4 rounded-lg bg-red-50 p-3 text-red-700"
  >
    {resumeError}
  </p>
)}

                      {application.cover_letter && (
                        <div className="mt-3">
                          <p className="font-medium">
                            Cover Letter
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
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
