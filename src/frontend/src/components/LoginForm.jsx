import { useState } from 'react'
import { loginUser } from '../api/auth'

// successMessage is the "Account created" banner passed down from App.jsx
// after a fresh signup. onLoggedIn hands the access token back up.
function LoginForm({ successMessage, onLoggedIn, onSwitchToSignup }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const { access_token: accessToken } = await loginUser(email, password)
      onLoggedIn(accessToken)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-gray-900">Log in</h1>

      {successMessage && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

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
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-md bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Logging in…' : 'Log in'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Need an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-medium text-purple-600 hover:underline"
        >
          Sign up
        </button>
      </p>
    </form>
  )
}

export default LoginForm
