
import ProfileSection from './ProfileSection'
import ResumeSection from './ResumeSection'

// Authenticated dashboard for managing profile and documents
function LoggedInScreen({ token, onFindJobs }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Manage your personal profile and uploaded resumes.
          </p>
        </div>

        <button
          type="button"
          onClick={onFindJobs}
          disabled={!onFindJobs}
          className="rounded-lg bg-purple-600 px-5 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Find Jobs
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <ProfileSection token={token} />
        <ResumeSection token={token} />
      </div>
    </div>
  )
}

export default LoggedInScreen
