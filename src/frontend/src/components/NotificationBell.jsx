import { getNotification, markNotificationAsRead, deleteNotification, markAllNotificationsAsRead, } from '../api/notification'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function NotificationBell({ token }) {
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifications, setNotifications] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const notificationRef = useRef(null)

    const refreshNotifications = useCallback(async () => {
        if (!token) {
            return
        }

        try {
            const data = await getNotification(token)
            setUnreadCount(data.unread_count)
            setNotifications(data.notifications)
        } catch (error) {
            console.error('Could not refresh notifications.', error)
        }
    }, [token])

    useEffect(() => {
        refreshNotifications()
        const intervalId = setInterval(refreshNotifications, 60_000)

        return () => clearInterval(intervalId)
    }, [refreshNotifications])

    useEffect(() => {
        function handleOutsideClick(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('pointerdown', handleOutsideClick)
        return () => document.removeEventListener('pointerdown', handleOutsideClick)
    }, [])

    async function handleClick(){
        setIsOpen((wasOpen) => !wasOpen)
        await refreshNotifications()
    }

    async function handleMarkAsRead(notificationId) {
        await markNotificationAsRead(token, notificationId)
        const data = await getNotification(token)
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count)
    }

    async function handleDelete(notificationId) {
        await deleteNotification(token, notificationId)
        const data = await getNotification(token)
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count)
    }

    async function handleMarkAllAsRead() {
        await markAllNotificationsAsRead(token)
        const data = await getNotification(token)
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count)
    }

    return(
        <div ref={notificationRef} className="relative flex items-center">
            <button
                type="button"
                onClick={handleClick}
                aria-label={`Notifications (${unreadCount} unread)`}
                title={`${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
                className="relative cursor-pointer text-purple-600 transition hover:text-purple-800"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.967 8.967 0 0 1-2.31 6.022 23.848 23.848 0 0 0 5.454 1.31m5.713 0a24.255 24.255 0 0 1-5.713 0m5.713 0a3 3 0 1 1-5.713 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs font-semibold leading-5 text-white">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (<ul className="absolute right-0 top-full z-10 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                <li>
                    <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                        className="mb-2 text-sm text-purple-600 hover:underline disabled:opacity-50"
                    >
                        Mark all as read
                    </button>
                </li>
                {notifications.map((notification) => (
                    <li key={notification.id} className={notification.is_read ? 'rounded-md p-2' : 'rounded-md bg-purple-50 p-2'}>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        {!notification.is_read && (
                            <button
                                type="button"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="mt-1 text-sm text-purple-600 hover:underline"
                            >
                                Mark as read
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => handleDelete(notification.id)}
                            className="ml-2 text-sm text-red-600 hover:underline"
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
            )}
        </div>
    )
}
