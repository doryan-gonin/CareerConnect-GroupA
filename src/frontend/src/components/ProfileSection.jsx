import { useState, useEffect } from 'react'
import MarkdownEditor from './MarkdownEditor'
import MarkdownView from './MarkdownView'
import {
  getProfile,
  updateProfile,
  addProfileLink,
  deleteProfileLink,
  addProfileLanguage,
  deleteProfileLanguage,
  addProfileEducation,
  deleteProfileEducation,
  addProfileExperience,
  deleteProfileExperience,
} from '../api/profiles'

const LINK_TYPES = [
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'personal_website', label: 'Personal Website' },
]

const FLUENCY_LEVELS = ['Basic', 'Intermediate', 'Fluent', 'Native']

function ProfileSection({ token }) {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Sub-resource form states
  const [linkType, setLinkType] = useState('github')
  const [linkUrl, setLinkUrl] = useState('')
  const [languageName, setLanguageName] = useState('')
  const [fluencyLevel, setFluencyLevel] = useState('Fluent')
  const [eduForm, setEduForm] = useState({ institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', description: '' })
  const [expForm, setExpForm] = useState({ company_name: '', job_title: '', start_date: '', end_date: '', description: '' })
  const [showAddLink, setShowAddLink] = useState(false)
  const [showAddLanguage, setShowAddLanguage] = useState(false)
  const [showAddEducation, setShowAddEducation] = useState(false)
  const [showAddExperience, setShowAddExperience] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      try {
        setError('')
        const data = await getProfile(token)
        if (isMounted) {
          setProfile(data)
          setFirstName(data.first_name || '')
          setLastName(data.last_name || '')
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
      loadProfile()
    }

    return () => {
      isMounted = false
    }
  }, [token])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      const updated = await updateProfile(token, { firstName, lastName })
      setProfile(updated)
      setIsEditing(false)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setFirstName(profile?.first_name || '')
    setLastName(profile?.last_name || '')
    setIsEditing(false)
    setError('')
  }

  async function refreshProfile() {
    const data = await getProfile(token)
    setProfile(data)
  }

  async function handleAddLink(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await addProfileLink(token, { link_type: linkType, url: linkUrl })
      setLinkUrl('')
      setShowAddLink(false)
      await refreshProfile()
      setSuccess('Link added.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteLink(id) {
    setError('')
    try {
      await deleteProfileLink(token, id)
      await refreshProfile()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddLanguage(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await addProfileLanguage(token, { language: languageName, fluency_level: fluencyLevel })
      setLanguageName('')
      setShowAddLanguage(false)
      await refreshProfile()
      setSuccess('Language added.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteLanguage(id) {
    setError('')
    try {
      await deleteProfileLanguage(token, id)
      await refreshProfile()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddEducation(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await addProfileEducation(token, {
        ...eduForm,
        field_of_study: eduForm.field_of_study || null,
        start_date: eduForm.start_date || null,
        end_date: eduForm.end_date || null,
        description: eduForm.description || null,
      })
      setEduForm({ institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', description: '' })
      setShowAddEducation(false)
      await refreshProfile()
      setSuccess('Education added.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteEducation(id) {
    setError('')
    try {
      await deleteProfileEducation(token, id)
      await refreshProfile()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddExperience(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await addProfileExperience(token, {
        ...expForm,
        start_date: expForm.start_date || null,
        end_date: expForm.end_date || null,
        description: expForm.description || null,
      })
      setExpForm({ company_name: '', job_title: '', start_date: '', end_date: '', description: '' })
      setShowAddExperience(false)
      await refreshProfile()
      setSuccess('Experience added.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteExperience(id) {
    setError('')
    try {
      await deleteProfileExperience(token, id)
      await refreshProfile()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
        {!isEditing && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setSuccess('')
              setError('')
              setIsEditing(true)
            }}
            className="text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            Edit
          </button>
        )}
      </div>

      {success && (
        <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading profile…</div>
      ) : isEditing ? (
        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            First Name
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Jane"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Last Name
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Doe"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <dt className="text-gray-500">First Name</dt>
            <dd className="font-medium text-gray-900">
              {profile?.first_name || <span className="italic text-gray-400">Not provided</span>}
            </dd>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <dt className="text-gray-500">Last Name</dt>
            <dd className="font-medium text-gray-900">
              {profile?.last_name || <span className="italic text-gray-400">Not provided</span>}
            </dd>
          </div>

          {profile?.last_updated && (
            <div className="flex flex-col sm:flex-row sm:justify-between border-t border-gray-100 pt-3">
              <dt className="text-gray-500">Last Updated</dt>
              <dd className="text-gray-600">
                {new Date(profile.last_updated).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      )}

      {!isLoading && profile && (
        <div className="mt-6 space-y-6 border-t border-gray-100 pt-6 text-sm">
          {/* Professional Links */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Professional Links</h3>
              {(profile.links || []).length < 3 && (
                <button
                  type="button"
                  onClick={() => setShowAddLink((prev) => !prev)}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700"
                >
                  {showAddLink ? 'Cancel' : '+ Add'}
                </button>
              )}
            </div>
            <ul className="mt-2 space-y-2">
              {(profile.links || []).map((link) => (
                <li key={link.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                  <div>
                    <span className="font-medium text-gray-700 capitalize">{link.link_type.replace('_', ' ')}: </span>
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">
                      {link.url}
                    </a>
                  </div>
                  <button type="button" onClick={() => handleDeleteLink(link.id)} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {showAddLink && (profile.links || []).length < 3 && (
              <form onSubmit={handleAddLink} className="mt-2 flex flex-wrap gap-2">
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                >
                  {LINK_TYPES.map((lt) => {
                    const taken = (profile.links || []).some((l) => l.link_type === lt.value)
                    return (
                      <option key={lt.value} value={lt.value} disabled={taken}>
                        {lt.label}{taken ? ' (Added)' : ''}
                      </option>
                    )
                  })}
                </select>
                <input
                  type="url"
                  required
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <button type="submit" className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700">
                  Add Link
                </button>
              </form>
            )}
          </div>

          {/* Languages */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Languages</h3>
              <button
                type="button"
                onClick={() => setShowAddLanguage((prev) => !prev)}
                className="text-xs font-medium text-purple-600 hover:text-purple-700"
              >
                {showAddLanguage ? 'Cancel' : '+ Add'}
              </button>
            </div>
            <ul className="mt-2 space-y-2">
              {(profile.languages || []).map((lang) => (
                <li key={lang.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                  <span>
                    <span className="font-medium text-gray-800">{lang.language}</span> — {lang.fluency_level}
                  </span>
                  <button type="button" onClick={() => handleDeleteLanguage(lang.id)} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {showAddLanguage && (
              <form onSubmit={handleAddLanguage} className="mt-2 flex flex-wrap gap-2">
              <input
                type="text"
                required
                value={languageName}
                onChange={(e) => setLanguageName(e.target.value)}
                placeholder="e.g. English"
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <select
                value={fluencyLevel}
                onChange={(e) => setFluencyLevel(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                {FLUENCY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
              <button type="submit" className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700">
                Add Language
              </button>
            </form>
            )}
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Education & Diplomas</h3>
              <button
                type="button"
                onClick={() => setShowAddEducation((prev) => !prev)}
                className="text-xs font-medium text-purple-600 hover:text-purple-700"
              >
                {showAddEducation ? 'Cancel' : '+ Add'}
              </button>
            </div>
            <ul className="mt-2 space-y-2">
              {(profile.education || []).map((edu) => (
                <li key={edu.id} className="flex items-start justify-between rounded-md bg-gray-50 px-3 py-2">
                  <div>
                    <p className="font-medium text-gray-800">{edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</p>
                    <p className="text-xs text-gray-600">{edu.institution} ({edu.start_date || '?'} – {edu.end_date || 'Present'})</p>
                  </div>
                  <button type="button" onClick={() => handleDeleteEducation(edu.id)} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {showAddEducation && (
              <form onSubmit={handleAddEducation} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                required
                value={eduForm.institution}
                onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                placeholder="Institution"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <input
                type="text"
                required
                value={eduForm.degree}
                onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                placeholder="Degree / Diploma"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <input
                type="text"
                value={eduForm.field_of_study}
                onChange={(e) => setEduForm({ ...eduForm, field_of_study: e.target.value })}
                placeholder="Field of study (optional)"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={eduForm.start_date}
                  onChange={(e) => setEduForm({ ...eduForm, start_date: e.target.value })}
                  className="w-1/2 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="date"
                  value={eduForm.end_date}
                  onChange={(e) => setEduForm({ ...eduForm, end_date: e.target.value })}
                  className="w-1/2 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <button type="submit" className="sm:col-span-2 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700">
                Add Education
              </button>
            </form>
            )}
          </div>

          {/* Work Experience */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Work Experience</h3>
              <button
                type="button"
                onClick={() => setShowAddExperience((prev) => !prev)}
                className="text-xs font-medium text-purple-600 hover:text-purple-700"
              >
                {showAddExperience ? 'Cancel' : '+ Add'}
              </button>
            </div>
            <ul className="mt-2 space-y-2">
              {(profile.experience || []).map((exp) => (
                <li key={exp.id} className="flex items-start justify-between rounded-md bg-gray-50 px-3 py-2">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-800">{exp.job_title} at {exp.company_name}</p>
                    <p className="text-xs text-gray-600">{exp.start_date || '?'} – {exp.end_date || 'Present'}</p>
                    {exp.description && (
                      <div className="text-xs text-gray-700">
                        <MarkdownView content={exp.description} />
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => handleDeleteExperience(exp.id)} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {showAddExperience && (
              <form onSubmit={handleAddExperience} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                required
                value={expForm.company_name}
                onChange={(e) => setExpForm({ ...expForm, company_name: e.target.value })}
                placeholder="Company Name"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <input
                type="text"
                required
                value={expForm.job_title}
                onChange={(e) => setExpForm({ ...expForm, job_title: e.target.value })}
                placeholder="Job Title"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <div className="flex gap-2 sm:col-span-2">
                <input
                  type="date"
                  value={expForm.start_date}
                  onChange={(e) => setExpForm({ ...expForm, start_date: e.target.value })}
                  className="w-1/2 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="date"
                  value={expForm.end_date}
                  onChange={(e) => setExpForm({ ...expForm, end_date: e.target.value })}
                  className="w-1/2 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <MarkdownEditor
                  value={expForm.description}
                  onChange={(val) => setExpForm({ ...expForm, description: val })}
                  placeholder="Describe your responsibilities and achievements (Markdown supported)..."
                />
              </div>
              <button type="submit" className="sm:col-span-2 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700">
                Add Experience
              </button>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSection
