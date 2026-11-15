import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationBell from './NotificationBell'
import * as notificationsApi from '../api/notifications'

vi.mock('../api/notifications', () => ({
  deleteNotification: vi.fn(),
  getNotifications: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  markNotificationAsRead: vi.fn(),
}))

const unread = {
  id: 1,
  title: 'Application update',
  message: 'Your application moved to Interview.',
  notification_type: 'status_update',
  is_read: false,
  created_at: '2026-11-15T12:00:00Z',
  reference_id: 8,
  reference_type: 'application',
}

const read = { ...unread, id: 2, title: 'Older update', is_read: true }

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notificationsApi.getNotifications.mockResolvedValue({ notifications: [unread, read], unread_count: 1, total_count: 2 })
    notificationsApi.markNotificationAsRead.mockResolvedValue({ ...unread, is_read: true })
    notificationsApi.markAllNotificationsAsRead.mockResolvedValue({ message: 'Marked 1 notification(s) as read.' })
    notificationsApi.deleteNotification.mockResolvedValue({ message: 'Notification deleted.' })
  })

  it('loads unread count and opens the notification list', async () => {
    const user = userEvent.setup()
    render(<NotificationBell token="token" />)

    expect(await screen.findByRole('button', { name: 'Notifications (1 unread)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Notifications (1 unread)' }))
    expect(screen.getByText('Application update')).toBeInTheDocument()
    expect(screen.getByText('Older update')).toBeInTheDocument()
  })

  it('marks a notification read and invokes the navigation callback', async () => {
    const user = userEvent.setup()
    const onNotificationClick = vi.fn()
    render(<NotificationBell token="token" onNotificationClick={onNotificationClick} />)
    await user.click(await screen.findByRole('button', { name: 'Notifications (1 unread)' }))
    await user.click(screen.getByRole('button', { name: /Application update/ }))

    await waitFor(() => expect(notificationsApi.markNotificationAsRead).toHaveBeenCalledWith('token', 1))
    expect(onNotificationClick).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it('supports mark-all-read and dismiss actions', async () => {
    const user = userEvent.setup()
    render(<NotificationBell token="token" />)
    await user.click(await screen.findByRole('button', { name: 'Notifications (1 unread)' }))
    await user.click(screen.getByRole('button', { name: 'Mark all read' }))
    await waitFor(() => expect(notificationsApi.markAllNotificationsAsRead).toHaveBeenCalledWith('token'))
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Dismiss' })[0])
    await waitFor(() => expect(notificationsApi.deleteNotification).toHaveBeenCalledWith('token', 1))
    expect(screen.queryByText('Application update')).not.toBeInTheDocument()
  })
})
