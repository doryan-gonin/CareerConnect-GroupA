import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notifications'

describe('notifications API', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('requests notifications with filters and authorization', async () => {
    const response = { notifications: [], total_count: 0, unread_count: 0 }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(response), { status: 200 }),
    )

    await expect(getNotifications('token', { unreadOnly: true, limit: 10, offset: 20 })).resolves.toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/notifications?unread_only=true&limit=10&offset=20',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    )
  })

  it('uses the correct mutation methods and paths', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    await markNotificationAsRead('token', 4)
    await markAllNotificationsAsRead('token')
    await deleteNotification('token', 5)

    expect(fetchMock.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      ['http://localhost:8000/api/notifications/4/read', 'PATCH'],
      ['http://localhost:8000/api/notifications/read-all', 'PATCH'],
      ['http://localhost:8000/api/notifications/5', 'DELETE'],
    ])
  })

  it('surfaces API validation errors and network failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Not authorized.' }), { status: 403 }),
    )
    await expect(markNotificationAsRead('token', 1)).rejects.toThrow('Not authorized.')

    vi.restoreAllMocks()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
    await expect(getNotifications('token')).rejects.toThrow('Could not reach the server.')
  })
})
