import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getResumes,
  uploadResume,
  setDefaultResume,
  downloadResume,
  deleteResume,
} from '../api/profiles'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_RESUMES = 5

function ResumeSection({ token }) {
  const [resumes, setResumes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)
  const [makeDefault, setMakeDefault] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  const refreshResumes = useCallback(async () => {
    try {
      const data = await getResumes(token)
      setResumes(data)
    } catch (err) {
      setError(err.message)
    }
  }, [token])

  useEffect(() => {
    let isMounted = true

    async function initialLoad() {
      try {
        const data = await getResumes(token)
        if (isMounted) {
          setResumes(data)
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
      initialLoad()
    }

    return () => {
      isMounted = false
    }
  }, [token])

  function handleFileChange(e) {
    setError('')
    setSuccess('')
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
      setError('Only PDF files are allowed.')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Resume must be under 5 megabytes.')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setSelectedFile(file)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!selectedFile) return

    if (resumes.length >= MAX_RESUMES) {
      setError('User already has 5 (or more) resumes.')
      return
    }

    setIsUploading(true)
    setError('')
    setSuccess('')

    try {
      await uploadResume(token, selectedFile, makeDefault)
      setSuccess(`"${selectedFile.name}" uploaded successfully.`)
      setSelectedFile(null)
      setMakeDefault(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await refreshResumes()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSetDefault(resumeId) {
    setActionId(resumeId)
    setError('')
    setSuccess('')

    try {
      await setDefaultResume(token, resumeId)
      setSuccess('Default resume updated.')
      await refreshResumes()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  async function handleDownload(resumeId, fileName) {
    setActionId(resumeId)
    setError('')

    try {
      await downloadResume(token, resumeId, fileName)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  async function handleDelete(resumeId, fileName) {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return
    }

    setActionId(resumeId)
    setError('')
    setSuccess('')

    try {
      await deleteResume(token, resumeId)
      setSuccess(`"${fileName}" deleted.`)
      await refreshResumes()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-lg font-medium text-gray-900">Resumes</h2>
        <span className="text-xs font-medium text-gray-500">
          {resumes.length} / {MAX_RESUMES} uploaded
        </span>
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

      {/* Upload Form */}
      {resumes.length < MAX_RESUMES ? (
        <form onSubmit={handleUpload} className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
          <label className="block text-sm font-medium text-gray-700">
            Upload a resume (PDF, up to 5MB)
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-purple-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-60"
            />
          </label>

          {selectedFile && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                  disabled={isUploading}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Set as default resume
              </label>

              <button
                type="submit"
                disabled={isUploading}
                className="rounded-md bg-purple-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-60"
              >
                {isUploading ? 'Uploading…' : 'Upload resume'}
              </button>
            </div>
          )}
        </form>
      ) : (
        <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
          You have reached the maximum limit of 5 resumes. Delete an existing resume to upload a new one.
        </p>
      )}

      {/* Resume List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Your Uploaded Resumes</h3>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-gray-500">Loading resumes…</div>
        ) : resumes.length === 0 ? (
          <div className="rounded-md bg-gray-50 py-6 text-center text-sm text-gray-500">
            No resumes uploaded yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 border-t border-gray-100">
            {resumes.map((resume) => {
              const isWorking = actionId === resume.id
              return (
                <li key={resume.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{resume.file_name}</span>
                      {resume.is_default && (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      Uploaded on {new Date(resume.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {!resume.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(resume.id)}
                        disabled={isWorking}
                        className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                      >
                        Set default
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownload(resume.id, resume.file_name)}
                      disabled={isWorking}
                      className="text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
                    >
                      Download
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(resume.id, resume.file_name)}
                      disabled={isWorking}
                      className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ResumeSection
