import { useState } from 'react'
import LoggedInScreen from './components/LoggedInScreen'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'

const TOKEN_STORAGE_KEY = 'accessToken'

// "view" is the tiny bit of state that swaps between the three screens.
// No router library needed for just three screens.
function App() {
  const [view, setView] = useState(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY) ? 'loggedIn' : 'login',
  )
  const [signupSuccessMessage, setSignupSuccessMessage] = useState('')

  function handleSignedUp() {
    setSignupSuccessMessage('Account created! You can now log in.')
    setView('login')
  }

  function handleLoggedIn(accessToken) {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    setView('loggedIn')
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setSignupSuccessMessage('')
    setView('login')
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
        {view === 'loggedIn' && <LoggedInScreen onLogout={handleLogout} />}
      </div>
    </div>
  )
}

export default App
