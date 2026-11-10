import { useState } from 'react'
import { registerUser } from '../api/auth'
import { isPasswordValid } from '../utils/passwordRules'
import PasswordRequirements from './PasswordRequirements'

// onSignedUp is called after a successful registration so the parent
// (App.jsx) can switch over to the login page.
function SignupForm({ onSignedUp, onSwitchToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRecruiter, setIsRecruiter] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!isPasswordValid(password)) {
      setError('Please meet all password requirements below.')
      return
    }

    setIsSubmitting(true)
    try {
      await registerUser(email, password, isRecruiter)
      onSignedUp(email, isRecruiter)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">Account Type</span>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account Type">
          <button
            type="button"
            role="radio"
            aria-checked={!isRecruiter}
            onClick={() => setIsRecruiter(false)}
            className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition cursor-pointer ${
              !isRecruiter
                ? 'border-purple-600 bg-purple-50 text-purple-900 ring-1 ring-purple-600'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-sm font-semibold">Job Seeker</span>
            <span className="text-xs text-gray-500">Apply for jobs</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={isRecruiter}
            onClick={() => setIsRecruiter(true)}
            className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition cursor-pointer ${
              isRecruiter
                ? 'border-purple-600 bg-purple-50 text-purple-900 ring-1 ring-purple-600'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-sm font-semibold">Recruiter</span>
            <span className="text-xs text-gray-500">Post & manage jobs</span>
          </button>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          placeholder="you@example.com"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Password
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          placeholder="••••••••"
        />
        <PasswordRequirements password={password} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Confirm password
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          placeholder="••••••••"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-md bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Creating account…' : 'Sign up'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault()
            onSwitchToLogin()
          }}
          className="font-medium text-purple-600 hover:underline cursor-pointer"
        >
          Log in
        </a>
      </p>
    </form>
  )
}

export default SignupForm
