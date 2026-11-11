import { useEffect, useRef, useState } from 'react'
import { getInterviewSession, sendInterviewMessage } from '../api/interview'
import MarkdownView from './MarkdownView'

const MAX_MESSAGE_CHARS = 2000

function InterviewConversation({ token, sessionId, onBack }) {
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const windowRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    getInterviewSession(token, sessionId)
      .then((data) => {
        if (isMounted) {
          setSession(data)
          setMessages(data.messages)
        }
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
  }, [token, sessionId])

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight
    }
  }, [messages, isSending])

  async function handleSend() {
    const content = draft.trim()
    if (!content || isSending) return

    const previousMessages = messages
    setMessages([...messages, { role: 'user', content }])
    setDraft('')
    setError('')
    setIsSending(true)

    try {
      const reply = await sendInterviewMessage(token, sessionId, content)
      setMessages((current) => [...current, reply])
    } catch (err) {
      setMessages(previousMessages)
      setDraft(content)
      setError(err.message)
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-purple-600 hover:underline">
        ← Back to sessions
      </button>

      {isLoading ? (
        <div className="py-6 text-center text-sm text-gray-500">Loading session…</div>
      ) : !session ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : (
        <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="border-b border-gray-100 pb-3">
            <h1 className="text-lg font-medium text-gray-900">{session.job_title}</h1>
            <p className="text-sm text-gray-500">{session.company_name}</p>
          </div>

          <div ref={windowRef} className="flex h-[28rem] flex-col gap-3 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'self-end bg-purple-600 text-white whitespace-pre-wrap'
                    : 'self-start bg-gray-100 text-gray-900'
                }`}
              >
                {message.role === 'user' ? (
                  message.content
                ) : (
                  <MarkdownView content={message.content} />
                )}
              </div>
            ))}
            {isSending && <div className="self-start rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">Thinking…</div>}
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={draft}
              maxLength={MAX_MESSAGE_CHARS}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer or question"
              className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || !draft.trim()}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewConversation
