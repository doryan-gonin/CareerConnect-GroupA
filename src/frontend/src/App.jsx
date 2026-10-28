import { useState } from 'react'
import LoggedInScreen from './components/LoggedInScreen'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Navbar from './components/Navbar'
import JobSearchPage from './components/JobSearchPage'
import { logoutUser } from './api/auth'

const TOKEN_STORAGE_KEY = 'accessToken'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [view, setView] = useState(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY) ? 'loggedIn' : 'login',
  )
  const [signupSuccessMessage, setSignupSuccessMessage] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  function handleSignedUp() {
    setSignupSuccessMessage('Account created! You can now log in.')
    setView('login')
  }

  function handleLoggedIn(accessToken) {
    setToken(accessToken)
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
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
      setIsLoggingOut(false)
      setView('login')
    }
  }

  if (view === 'jobSearch') {
    return (
      <JobSearchPage
        token={token}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        onNavigateDashboard={() => setView('loggedIn')}
      />
    )
  }

  if (view === 'loggedIn') {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
          onBrowseJobs={() => setView('jobSearch')}
        />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <LoggedInScreen token={token} onLogout={handleLogout} />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        {view === 'signup' && (
          <SignupForm
            onSignedUp={handleSignedUp}
            onSwitchToLogin={() => setView('login')}
          />
        )}
        {view === 'login' && (
          <LoginForm
            successMessage={signupSuccessMessage}
            onLoggedIn={handleLoggedIn}
            onSwitchToSignup={() => {
              setSignupSuccessMessage('')
              setView('signup')
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App
