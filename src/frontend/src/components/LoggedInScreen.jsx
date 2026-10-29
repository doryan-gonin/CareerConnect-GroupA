import ApplicationsSection from './ApplicationsSection'
import ProfileSection from './ProfileSection'
import ResumeSection from './ResumeSection'

// Authenticated dashboard screen for managing profile, documents, and applications
function LoggedInScreen({ token }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Manage your personal profile, uploaded resumes, and job applications.
        </p>
      </div>

      {/* Grid for Profile & Resumes */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <ProfileSection token={token} />
        <ResumeSection token={token} />
      </div>

      <ApplicationsSection token={token} />
    </div>
  )
}

export default LoggedInScreen
