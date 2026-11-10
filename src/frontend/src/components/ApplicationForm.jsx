import { getMyApplications } from '../api/applications'
import { getCurrentUser } from '../api/auth'
import { useEffect, useRef, useState } from 'react'
import {
  getProfile,
  getResumes,
  updateProfile,
  uploadResume,
} from '../api/profiles'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_RESUMES = 5

function ApplicationForm({ token, job, onBack, onSubmitApplication }) {
  const [resumes, setResumes] = useState([])
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [nameEdit, setNameEdit] = useState(null)
  const [uploadNotice, setUploadNotice] = useState('')
  const fileInputRef = useRef(null)
  const [resumeMode, setResumeMode] = useState('existing')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [account, setAccount] = useState(null)
  const [accountLoading, setAccountLoading] = useState(true)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [checkingApplication, setCheckingApplication] = useState(true)

  const profileName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')

  useEffect(() => {
    let active = true

    async function loadResumes() {
      setIsLoading(true)

      try {
        const data = await getResumes(token)

        if (active) {
          setResumes(data)

          const defaultResume = data.find(
            (resume) => resume.is_default
          )

          setSelectedResumeId(
            String(defaultResume?.id ?? data[0]?.id ?? '')
          )
        }
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    if (token) loadResumes()

    return () => {
      active = false
    }
  }, [token])

  
useEffect(() => {
  let active = true

  async function loadProfile() {
    setProfileLoading(true)

    try {
      const data = await getProfile(token)

      if (active) {
        setProfile(data)
      }
    } catch (err) {
      if (active) {
        setError(err.message)
      }
    } finally {
      if (active) {
        setProfileLoading(false)
      }
    }
  }

  if (token) {
    loadProfile()
  } else {
    setProfileLoading(false)
  }

  return () => {
    active = false
  }
}, [token])


useEffect(() => {
  let active = true

  async function loadAccount() {
    setAccountLoading(true)

    try {
      const data = await getCurrentUser(token)

      if (active) {
        setAccount(data)
      }
    } catch (err) {
      if (active) {
        setError(err.message)
      }
    } finally {
      if (active) {
        setAccountLoading(false)
      }
    }
  }

  if (token) {
    loadAccount()
  } else {
    setAccountLoading(false)
  }

  return () => {
    active = false
  }
}, [token])

  
useEffect(() => {
  let active = true

  async function checkExistingApplication() {
    setCheckingApplication(true)
    setAlreadyApplied(false)

    try {
      const applications = await getMyApplications(token)

      if (active) {
        const exists = applications.some(
          (application) => application.job_id === job?.id
        )

        setAlreadyApplied(exists)
      }
    } catch (err) {
      if (active) {
        setError(err.message)
      }
    } finally {
      if (active) {
        setCheckingApplication(false)
      }
    }
  }

  if (token && job?.id) {
    checkExistingApplication()
  } else {
    setCheckingApplication(false)
  }

  return () => {
    active = false
  }
}, [token, job?.id])


  async function handleFileChange(event) {
    setError('')
    setUploadNotice('')

    const input = event.target
    const file = input.files?.[0]
    input.value = ''

    if (!file) return

    if (
      !file.name.toLowerCase().endsWith('.pdf') ||
      (file.type && file.type !== 'application/pdf')
    ) {
      setError('Only PDF files are allowed.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Resume must be under 5 MB.')
      return
    }

    setIsUploading(true)

    try {
      const uploaded = await uploadResume(token, file, false)
      setResumes(await getResumes(token))
      setSelectedResumeId(String(uploaded.id))
      setResumeMode('existing')
      setUploadNotice(`"${file.name}" was uploaded and selected for this application.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (alreadyApplied || checkingApplication) {
  return
}

    if (!job?.id) {
      setError('Please select a valid job posting.')
      return
    }

    if (!selectedResumeId) {
      setError('Please select a resume before applying.')
      return
    }

    if (typeof onSubmitApplication !== 'function') {
      setError('Application submission is not connected yet.')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const fullName = (nameEdit ?? profileName).trim()
      if (fullName && fullName !== profileName) {
        const [firstName, ...rest] = fullName.split(/\s+/)
        await updateProfile(token, { firstName, lastName: rest.join(' ') })
      }

      await onSubmitApplication({
        job_id: job.id,
        resume_id: Number(selectedResumeId),
      })

      setSuccess('Your application was submitted successfully!')
      setAlreadyApplied(true)
    } catch (err) {
      setError(err.message || 'Application submission failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 text-sm font-medium text-purple-600 hover:underline"
      >
        ← Back to Posting
      </button>

     <h1 className="text-2xl font-semibold text-gray-900">
  {checkingApplication
    ? 'Application Details'
    : success
      ? 'Application Submitted'
      : alreadyApplied
        ? 'Already Applied'
        : 'Submit Your Application'}
</h1>

      <div className="mt-5 rounded-lg bg-gray-50 p-4">
        <h2 className="font-semibold">{job?.title}</h2>
        <p className="text-sm text-gray-600">
          {job?.company_name}
        </p>
        <p className="text-sm text-gray-500">
          {job?.location}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        
<div className="rounded-lg border border-gray-200 p-4">
  <h2 className="mb-3 text-lg font-medium text-gray-900">
    Applicant Information
  </h2>

  <label
    htmlFor="applicant-name"
    className="block text-sm font-medium text-gray-700"
  >
    Full Name
  </label>

  <input
    id="applicant-name"
    type="text"
    value={nameEdit ?? profileName}
    onChange={(e) => setNameEdit(e.target.value)}
    placeholder={profileLoading ? 'Loading...' : 'Your full name'}
    disabled={profileLoading || alreadyApplied}
    className="mt-2 w-full rounded-md border border-gray-300 p-3 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
  />
  <p className="mt-1 text-xs text-gray-500">Changes are saved to your profile when you apply.</p>
  
<label
  htmlFor="applicant-email"
  className="mt-4 block text-sm font-medium text-gray-700"
>
  Email Address
</label>

<input
  id="applicant-email"
  type="email"
  value={account?.email_address ?? ''}
  placeholder={accountLoading ? 'Loading email...' : 'Email unavailable'}
  readOnly
  className="mt-2 w-full rounded-md border border-gray-300 bg-gray-50 p-3 text-gray-700"
/>
<p className="mt-1 text-xs text-gray-500">This is the email on your account.</p>

</div>
     {!alreadyApplied && !checkingApplication && (
        <div>
          <h2 className="mb-3 text-lg font-medium">
            Choose Your Resume
          </h2>

          <label className="mb-3 flex items-center gap-2">
            <input
              type="radio"
              checked={resumeMode === 'existing'}
              onChange={() => setResumeMode('existing')}
            />
            Use an existing resume
          </label>

          <label className="mb-3 flex items-center gap-2">
            <input
              type="radio"
              checked={resumeMode === 'new'}
              onChange={() => setResumeMode('new')}
            />
            Upload a new resume
          </label>

          {resumeMode === 'existing' ? (
            <div>
              {isLoading ? (
                <p>Loading resumes...</p>
              ) : resumes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No resumes available. Upload one to continue.
                </p>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={(e) =>
                    setSelectedResumeId(e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 p-3"
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.file_name}
                      {resume.is_default ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              )}
              {uploadNotice && (
                <p role="status" className="mt-2 text-sm text-green-700">{uploadNotice}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                aria-label="Resume PDF file"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || resumes.length >= MAX_RESUMES}
                className="rounded-lg bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Resume'}
              </button>

              <p className="text-sm text-gray-500">
                PDF only, up to 5 MB. It is saved to your profile and selected for this application.
              </p>

              {resumes.length >= MAX_RESUMES && (
                <p className="text-sm text-red-600">
                  Maximum of 5 resumes reached.
                </p>
              )}
            </div>
          )}
        </div>

        
        )}
{checkingApplication ? (
  <p className="text-center text-sm text-gray-500">
    Checking application status...
  </p>
) : success ? null : alreadyApplied ? (
  <div
    role="status"
    className="rounded-lg border border-green-200 bg-green-50 p-4 text-center"
  >
    <p className="font-semibold text-green-700">
      Already Applied
    </p>
    <p className="mt-2 text-sm text-green-600">
      You have already submitted an application for this job.
    </p>
  </div>
) : (
  <button
    type="submit"
    disabled={
      isSubmitting ||
      isUploading ||
      isLoading ||
      !selectedResumeId ||
      resumeMode === 'new'
    }
    className="w-full rounded-lg bg-purple-600 px-5 py-3 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
  >
    {isSubmitting ? 'Submitting...' : 'Submit Application'}
  </button>
)}


      </form>
    </div>
  )
}

export default ApplicationForm
