// Authenticated dashboard screen for managing profile and documents
function LoggedInScreen({ token: _token, onLogout: _onLogout, userEmail: _userEmail }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Manage your personal profile and resumes.
        </p>
      </div>

      {/* Grid for Profile & Resumes */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Profile Card Placeholder */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="border-b border-gray-100 pb-3 text-lg font-medium text-gray-900">
            Profile Information
          </h2>
          <div className="py-8 text-center text-sm text-gray-500">
            Profile details and edit form will appear here.
          </div>
        </div>

        {/* Resume Card Placeholder */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="border-b border-gray-100 pb-3 text-lg font-medium text-gray-900">
            Resumes
          </h2>
          <div className="py-8 text-center text-sm text-gray-500">
            Resume upload and management will appear here.
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoggedInScreen
