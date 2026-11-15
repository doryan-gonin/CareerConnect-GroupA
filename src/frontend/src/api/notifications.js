import { API_BASE_URL } from './client'

function extractErrorMessage(body, fallback) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(' ')
  return fallback
}

async function requestNotifications(token, path, { method = 'GET' } = {}, fallback = 'Notification request failed.') {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/notifications${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new Error('Could not reach the server. Is the backend running?')
  }

  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(extractErrorMessage(body, fallback))
  return body
}

export function getNotifications(token, { unreadOnly = false, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({
    unread_only: String(unreadOnly),
    limit: String(limit),
    offset: String(offset),
  })
  return requestNotifications(token, `?${params.toString()}`, {}, 'Failed to load notifications.')
}

export function markNotificationAsRead(token, notificationId) {
  return requestNotifications(token, `/${notificationId}/read`, { method: 'PATCH' }, 'Failed to mark notification as read.')
}

export function markAllNotificationsAsRead(token) {
  return requestNotifications(token, '/read-all', { method: 'PATCH' }, 'Failed to mark notifications as read.')
}

export function deleteNotification(token, notificationId) {
  return requestNotifications(token, `/${notificationId}`, { method: 'DELETE' }, 'Failed to dismiss notification.')
}
