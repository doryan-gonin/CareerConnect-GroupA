function Navbar({ onLogout, isLoggingOut = false, userEmail = '', onBrowseJobs }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">
            Career<span className="text-purple-600">Connect</span>
          </span>
        </div>

        {/* User & Logout */}
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="text-sm text-gray-600">{userEmail}</span>
          )}

          {onBrowseJobs && (
            <button
              type="button"
              onClick={onBrowseJobs}
              className="text-sm font-medium text-purple-600 hover:underline"
            >
              Browse Jobs
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
