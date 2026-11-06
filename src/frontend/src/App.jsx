
import { useState } from 'react'
import LoggedInScreen from './components/LoggedInScreen'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Navbar from './components/Navbar'
import JobSearchPage from './components/JobSearchPage'
import ApplicationForm from './components/ApplicationForm'
import { logoutUser } from './api/auth'
import { submitApplication } from './api/applications'

const TOKEN_STORAGE_KEY = 'accessToken'

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_STORAGE_KEY) || ''
  )

  const [view, setView] = useState(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY)
      ? 'loggedIn'
      : 'login'
  )

  const [activePage, setActivePage] = useState('dashboard')
  const [selectedJob, setSelectedJob] = useState(null)
  const [signupSuccessMessage, setSignupSuccessMessage] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  function handleSignedUp() {
    setSignupSuccessMessage('Account created! You can now log in.')
    setView('login')
  }

  function handleLoggedIn(accessToken) {
    setToken(accessToken)
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)

    setActivePage('dashboard')
    setSelectedJob(null)
    setSignupSuccessMessage('')
    setView('loggedIn')
  }

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      if (token) {
        await logoutUser(token)
      }
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      setToken('')
      setSignupSuccessMessage('')
      setActivePage('dashboard')
      setSelectedJob(null)
      setIsLoggingOut(false)
      setView('login')
    }
  }

  // Development-only job search preview
  if (
    import.meta.env.DEV &&
    window.location.pathname === '/job-search-preview'
  ) {
    return <JobSearchPage />
  }

  // Logged-in pages
  if (view === 'loggedIn') {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />

        <main className="mx-auto max-w-6xl px-4 py-8">
          {activePage === 'dashboard' && (
            <LoggedInScreen
              token={token}
              onFindJobs={() => setActivePage('jobs')}
            />
          )}

          {activePage === 'jobs' && (
            <div>
              <button
                type="button"
                onClick={() => setActivePage('dashboard')}
                className="mb-4 text-purple-600 hover:underline"
              >
                ← Back to Dashboard
              </button>

              <JobSearchPage
                onApply={(job) => {
                  setSelectedJob(job)
                  setActivePage('application')
                }}
              />
            </div>
          )}

          {activePage === 'application' && (
            <ApplicationForm
              token={token}
              job={selectedJob}
              onBack={() => setActivePage('jobs')}
              onSubmitApplication={({ job_id, resume_id }) =>
                submitApplication(token, job_id, resume_id)
              }
            />
          )}
        </main>
      </div>
    )
  }

  // Login and signup pages
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        {view === 'login' && (
          <LoginForm
            successMessage={signupSuccessMessage}
            onLoggedIn={handleLoggedIn}
            onSwitchToSignup={() => setView('signup')}
          />
        )}

        {view === 'signup' && (
          <SignupForm
            onSignedUp={handleSignedUp}
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </div>
    </div>
  )
}

export default App
