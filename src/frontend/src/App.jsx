import { useState, useEffect, useRef } from 'react'
import LoggedInScreen from './components/LoggedInScreen'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Navbar from './components/Navbar'
import JobSearchPage from './components/JobSearchPage'
import JobDetailPage from './components/JobDetailPage'
import RecruiterDashboard from './components/RecruiterDashboard'
import InterviewPrepPage from './components/InterviewPrepPage'
import InterviewNewSession from './components/InterviewNewSession'
import InterviewConversation from './components/InterviewConversation'
import AnalyticsPage from './components/AnalyticsPage'
import { logoutUser, getCurrentUser } from './api/auth'

const TOKEN_STORAGE_KEY = 'accessToken'

function normalizePath(pathname) {
  const cleaned = pathname.replace(/\/+$/, '')
  return cleaned === '' ? '/' : cleaned
}


function isAllowedAppPath(path) {
  return (
    path === '/dashboard' ||
    path === '/analytics' ||
    path === '/jobs' ||
    path === '/recruiter/dashboard' ||
    /^\/jobs\/\d+$/.test(path) ||
    /^\/interview(\/new|\/\d+)?$/.test(path)
  )
}


function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [isRecruiter, setIsRecruiter] = useState(() => localStorage.getItem('isRecruiter') === 'true')
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
      if (initialPath === '/recruiter/dashboard') return '/dashboard'
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
    if (!token) return

    let isMounted = true
    getCurrentUser(token)
      .then((user) => {
        if (isMounted && typeof user.is_recruiter === 'boolean') {
          setIsRecruiter(user.is_recruiter)
          localStorage.setItem('isRecruiter', String(user.is_recruiter))
        }
      })
      .catch((err) => {
        if (isMounted && err.message && err.message.toLowerCase().includes('token')) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          localStorage.removeItem('isRecruiter')
          setToken('')
          setIsRecruiter(false)
          navigate('/login')
        }
      })

    return () => {
      isMounted = false
    }
  }, [token])

  useEffect(() => {
    if (!token) return

    // Redirect obsolete recruiter route to unified dashboard
    if (currentPath === '/recruiter/dashboard') {
      navigate('/dashboard', { replace: true })
      return
    }

    // Role-based route protection
    if (isRecruiter) {
      if (currentPath.startsWith('/interview') || currentPath === '/analytics') {
        navigate('/dashboard', { replace: true })
        return
      }
      if (currentPath.endsWith('/apply')) {
        const match = currentPath.match(/^(\/jobs\/\d+)\/apply$/)
        navigate(match ? match[1] : '/dashboard', { replace: true })
      }
    }
  }, [token, isRecruiter, currentPath])

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

  function handleLoggedIn(accessToken, recruiterFlag) {
    setToken(accessToken)
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    if (typeof recruiterFlag === 'boolean') {
      setIsRecruiter(recruiterFlag)
      localStorage.setItem('isRecruiter', String(recruiterFlag))
    }
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
      localStorage.removeItem('isRecruiter')
      setToken('')
      setIsRecruiter(false)
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
        isApplying={!isRecruiter && Boolean(jobDetailMatch[2])}
        onApply={isRecruiter ? undefined : () => openApplication(jobId)}
        onBackToPosting={() => navigate(`/jobs/${jobId}`)}
        onNavigateJobs={() => navigate('/jobs')}
        onNavigateDashboard={() => navigate('/dashboard')}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        isRecruiter={isRecruiter}
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
        onApplyJob={isRecruiter ? undefined : openApplication}
        isRecruiter={isRecruiter}
      />
    )
  }

  if (token) {
    const interviewMatch = currentPath.match(/^\/interview\/(\d+)$/)
    let pageContent = null

    if (isRecruiter) {
      pageContent = <RecruiterDashboard token={token} />
    } else if (currentPath === '/analytics') {
      pageContent = (
        <AnalyticsPage
          token={token}
          onBack={() => navigate('/dashboard')}
        />
      )
    } else if (interviewMatch) {
      pageContent = (
        <InterviewConversation
          key={interviewMatch[1]}
          token={token}
          sessionId={Number(interviewMatch[1])}
          onBack={() => navigate('/interview')}
        />
      )
    } else if (currentPath === '/interview/new') {
      pageContent = (
        <InterviewNewSession
          token={token}
          onBack={() => navigate('/interview')}
          onBrowseJobs={() => navigate('/jobs')}
          onCreated={(id) => navigate(`/interview/${id}`, { replace: true })}
        />
      )
    } else if (currentPath === '/interview') {
      pageContent = (
        <InterviewPrepPage
          token={token}
          onNewSession={() => navigate('/interview/new')}
          onOpenSession={(id) => navigate(`/interview/${id}`)}
        />
      )
    } else {
      pageContent = (
        <LoggedInScreen
          token={token}
          onLogout={handleLogout}
          onViewAnalytics={() => navigate('/analytics')}
        />
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
          onBrowseJobs={() => navigate('/jobs')}
          onInterviewPrep={isRecruiter ? undefined : () => navigate('/interview')}
          onDashboard={currentPath !== '/dashboard' ? () => navigate('/dashboard') : undefined}
          isRecruiter={isRecruiter}
        />
        <main className="mx-auto max-w-5xl px-4 py-8">
          {pageContent}
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