import { getNotification, markNotificationAsRead, deleteNotification, markAllNotificationsAsRead, } from '../api/notification'
import { useState } from 'react'

export default function NotificationBell({ token }) {
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifications, setNotifications] = useState([])
    const [isOpen, setIsOpen] = useState(false)

    async function handleClick(){
        setIsOpen((wasOpen) => !wasOpen)
        const data = await getNotification(token)
        console.log(data)
        setUnreadCount(data.unread_count)
        setNotifications(data.notifications)
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
        <div className="relative flex items-center">
            <button
                type="button"
                onClick={handleClick}
                className="text-sm font-medium text-purple-600 hover:underline cursor-pointer"
            >
                Notifications({unreadCount})
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