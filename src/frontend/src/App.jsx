import { useState, useEffect, useRef } from 'react'
import LoggedInScreen from './components/LoggedInScreen'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Navbar from './components/Navbar'
import JobSearchPage from './components/JobSearchPage'
import JobDetailPage from './components/JobDetailPage'
import InterviewPrepPage from './components/InterviewPrepPage'
import InterviewNewSession from './components/InterviewNewSession'
import InterviewConversation from './components/InterviewConversation'
import AnalyticsPage from './components/AnalyticsPage'
import { logoutUser } from './api/auth'

const TOKEN_STORAGE_KEY = 'accessToken'

function normalizePath(pathname) {
  const cleaned = pathname.replace(/\/+$/, '')
  return cleaned === '' ? '/' : cleaned
}

function isAllowedAppPath(path) {
  return path === '/dashboard' || path === '/analytics' || path === '/jobs' || /^\/jobs\/\d+$/.test(path) || /^\/interview(\/new|\/\d+)?$/.test(path)
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const initialRawPath = normalizePath(window.location.pathname)
  const intendedPathRef = useRef(
    isAllowedAppPath(initialRawPath)
      ? initialRawPath
      : '/dashboard'
  )
  const [currentPath, setCurrentPath] = useState(() => {
    const initialPath = normalizePath(window.location.pathname)
    const hasToken = Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
    if (hasToken) {
      return isAllowedAppPath(initialPath) ? initialPath : '/dashboard'
    }
    return initialPath === '/signup' ? '/signup' : '/login'
  })
  const [signupSuccessMessage, setSignupSuccessMessage] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  function navigate(newPath, { replace = false } = {}) {
    const normalized = normalizePath(newPath)
    if (window.location.pathname !== normalized) {
      if (replace) {
        window.history.replaceState(null, '', normalized)
      } else {
        window.history.pushState(null, '', normalized)
      }
    }
    setCurrentPath(normalized)
  }

  useEffect(() => {
    if (window.location.pathname !== currentPath) {
      window.history.replaceState(null, '', currentPath)
    }
  }, [currentPath])

  useEffect(() => {
    function handlePopState() {
      const nextPath = normalizePath(window.location.pathname)
      const hasToken = Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
      if (hasToken) {
        if (nextPath === '/login' || nextPath === '/signup') {
          window.history.replaceState(null, '', '/dashboard')
          setCurrentPath('/dashboard')
          return
        }
        setCurrentPath(isAllowedAppPath(nextPath) ? nextPath : '/dashboard')
      } else {
        if (nextPath !== '/signup' && nextPath !== '/login') {
          window.history.replaceState(null, '', '/login')
          setCurrentPath('/login')
          return
        }
        setCurrentPath(nextPath)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function handleSignedUp() {
    setSignupSuccessMessage('Account created! You can now log in.')
    navigate('/login')
  }

  function handleLoggedIn(accessToken) {
    setToken(accessToken)
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    const target = intendedPathRef.current || '/dashboard'
    intendedPathRef.current = '/dashboard'
    navigate(target)
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
      navigate('/login')
    }
  }

  function openApplication(jobId) {
    navigate(`/jobs/${jobId}/apply`)
    window.scrollTo(0, 0)
  }

  const jobDetailMatch = currentPath.match(/^\/jobs\/(\d+)(\/apply)?$/)
  if (token && jobDetailMatch) {
    const jobId = Number(jobDetailMatch[1])
    return (
      <JobDetailPage
        token={token}
        jobId={jobId}
        isApplying={Boolean(jobDetailMatch[2])}
        onApply={() => openApplication(jobId)}
        onBackToPosting={() => navigate(`/jobs/${jobId}`)}
        onNavigateJobs={() => navigate('/jobs')}
        onNavigateDashboard={() => navigate('/dashboard')}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    )
  }

  if (token && currentPath === '/jobs') {
    return (
      <JobSearchPage
        token={token}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        onNavigateDashboard={() => navigate('/dashboard')}
        onViewJob={(jobId) => navigate(`/jobs/${jobId}`)}
        onApplyJob={openApplication}
      />
    )
  }

  if (token) {
    const interviewMatch = currentPath.match(/^\/interview\/(\d+)$/)
    let page = (
      <LoggedInScreen
        token={token}
        onLogout={handleLogout}
        onViewAnalytics={() => navigate('/analytics')}
      />
    )
    if (interviewMatch) {
      page = (
        <InterviewConversation
          key={interviewMatch[1]}
          token={token}
          sessionId={Number(interviewMatch[1])}
          onBack={() => navigate('/interview')}
        />
      )
    } else if (currentPath === '/interview/new') {
      page = (
        <InterviewNewSession
          token={token}
          onBack={() => navigate('/interview')}
          onBrowseJobs={() => navigate('/jobs')}
          onCreated={(id) => navigate(`/interview/${id}`, { replace: true })}
        />
      )
    } else if (currentPath === '/interview') {
      page = (
        <InterviewPrepPage
          token={token}
          onNewSession={() => navigate('/interview/new')}
          onOpenSession={(id) => navigate(`/interview/${id}`)}
        />
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
          onBrowseJobs={() => navigate('/jobs')}
          onInterviewPrep={() => navigate('/interview')}
          onDashboard={currentPath.startsWith('/interview') ? () => navigate('/dashboard') : undefined}
        />
        <main className="mx-auto max-w-5xl px-4 py-8">
          {currentPath === '/analytics' ? (
            <AnalyticsPage token={token} onBack={() => navigate('/dashboard')} />
          ) : (
            page
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        {currentPath === '/signup' ? (
          <SignupForm
            onSignedUp={handleSignedUp}
            onSwitchToLogin={() => {
              setSignupSuccessMessage('')
              navigate('/login')
            }}
          />
        ) : (
          <LoginForm
            successMessage={signupSuccessMessage}
            onLoggedIn={handleLoggedIn}
            onSwitchToSignup={() => {
              setSignupSuccessMessage('')
              navigate('/signup')
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App
