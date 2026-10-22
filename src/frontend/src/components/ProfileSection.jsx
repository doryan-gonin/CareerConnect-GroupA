import { useState, useEffect } from 'react'
import { getProfile, updateProfile } from '../api/profiles'

function ProfileSection({ token }) {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    </div>
  )
}

export default ProfileSection
