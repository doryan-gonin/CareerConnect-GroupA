import { useEffect, useState } from 'react'
import { getInterviewSessions } from '../api/interview'

function InterviewPrepPage({ token, onNewSession, onOpenSession }) {
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    getInterviewSessions(token)
      .then((data) => {
        if (isMounted) setSessions(data)
      })
      .catch((err) => {
        if (isMounted) setError(err.message)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Interview Prep</h1>
          <p className="text-sm text-gray-600">Practice with AI for the jobs you applied to.</p>
        </div>
        <button
          type="button"
          onClick={onNewSession}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
        >
          New session
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="border-b border-gray-100 pb-3 text-lg font-medium text-gray-900">Past sessions</h2>

        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {isLoading ? (
          <div className="py-6 text-center text-sm text-gray-500">Loading sessions…</div>
        ) : !error && sessions.length === 0 ? (
          <div className="mt-4 rounded-md bg-gray-50 py-6 text-center text-sm text-gray-500">
            No interview sessions yet. Start one to begin practicing.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => onOpenSession(session.id)}
                  className="group flex w-full flex-col gap-1 py-3 text-left"
                >
                  <span className="text-sm font-medium text-gray-900 group-hover:text-purple-600">{session.job_title}</span>
                  <span className="text-xs text-gray-500">
                    {session.company_name} · Last active {new Date(session.updated_at).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default InterviewPrepPage
