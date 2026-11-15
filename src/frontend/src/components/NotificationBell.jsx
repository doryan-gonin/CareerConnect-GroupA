import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notifications'

function formatNotificationDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

function NotificationBell({ token, onNotificationClick }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)
  const containerRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setError('')
    try {
      const data = await getNotifications(token)
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false)
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  async function handleNotificationClick(notification) {
    setActionId(notification.id)
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(token, notification.id)
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, is_read: true } : item
        )))
        setUnreadCount((count) => Math.max(0, count - 1))
      }
      setIsOpen(false)
      onNotificationClick?.(notification)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  async function handleDismiss(event, notificationId) {
    event.stopPropagation()
    setActionId(notificationId)
    try {
      const dismissed = notifications.find((notification) => notification.id === notificationId)
      await deleteNotification(token, notificationId)
      setNotifications((current) => current.filter((notification) => notification.id !== notificationId))
      if (dismissed && !dismissed.is_read) setUnreadCount((count) => Math.max(0, count - 1))
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  async function handleMarkAllRead() {
    if (!unreadCount) return
    setActionId('all')
    try {
      await markAllNotificationsAsRead(token)
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  function toggleNotifications() {
    const nextIsOpen = !isOpen
    setIsOpen(nextIsOpen)
    if (nextIsOpen) loadNotifications()
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleNotifications}
        aria-label={unreadCount ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        aria-expanded={isOpen}
        className="relative rounded-md p-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-purple-600"
      >
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
            <button type="button" onClick={handleMarkAllRead} disabled={!unreadCount || actionId === 'all'} className="text-xs font-medium text-purple-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400">Mark all read</button>
          </div>
          {error && <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}
          {isLoading ? <p className="px-4 py-6 text-center text-sm text-gray-500">Loading notifications…</p> : notifications.length === 0 ? <p className="px-4 py-6 text-center text-sm text-gray-500">You’re all caught up.</p> : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id} className={`border-b border-gray-100 px-4 py-3 ${notification.is_read ? 'bg-white' : 'bg-purple-50/60'}`}>
                  <div className="flex items-start gap-3">
                    <button type="button" onClick={() => handleNotificationClick(notification)} disabled={actionId === notification.id} className="min-w-0 flex-1 text-left transition hover:text-purple-700 disabled:cursor-wait">
                      <div className="flex items-start justify-between gap-3"><span className={`text-sm ${notification.is_read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>{notification.title}</span>{!notification.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-purple-600" aria-label="Unread" />}</div>
                      <p className="mt-1 text-xs leading-5 text-gray-600">{notification.message}</p>
                      <span className="mt-2 block text-[11px] text-gray-400">{formatNotificationDate(notification.created_at)}</span>
                    </button>
                    <button type="button" onClick={(event) => handleDismiss(event, notification.id)} disabled={actionId === notification.id} className="shrink-0 text-[11px] font-medium text-gray-500 hover:text-red-600 hover:underline disabled:cursor-wait">Dismiss</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
