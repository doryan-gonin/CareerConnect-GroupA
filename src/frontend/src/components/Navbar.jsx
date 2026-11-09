function NavLink({ href, onClick, children }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
      className="text-sm font-medium text-purple-600 hover:underline cursor-pointer"
    >
      {children}
    </a>
  )
}

function Navbar({ onLogout, isLoggingOut = false, onBrowseJobs, onInterviewPrep, onDashboard }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">
            Career<span className="text-purple-600">Connect</span>
          </span>
        </div>

        {/* User & Logout */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {onDashboard && <NavLink href="/dashboard" onClick={onDashboard}>Dashboard</NavLink>}
          {onBrowseJobs && <NavLink href="/jobs" onClick={onBrowseJobs}>Browse Jobs</NavLink>}
          {onInterviewPrep && <NavLink href="/interview" onClick={onInterviewPrep}>Interview Prep</NavLink>}

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
