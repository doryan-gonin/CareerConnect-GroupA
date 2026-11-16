import { API_BASE_URL } from './client'

const Notification_URL = `${API_BASE_URL}/api/notifications`

export async function getNotification(token){
    const response = await fetch(Notification_URL, {
        headers:{
            Authorization: `Bearer ${token}`
        }
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error('Could not load notifications.')
    }

    return data
}

export async function markNotificationAsRead(token, notificationId) {
    const response = await fetch(`${Notification_URL}/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error('Could not mark notification as read.')
    }

    return data
}

export async function deleteNotification(token, notificationId) {
    const response = await fetch(`${Notification_URL}/${notificationId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error('Could not delete notification.')
    }

    return data
}

export async function markAllNotificationsAsRead(token) {
    const response = await fetch(`${Notification_URL}/read-all`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error('Could not mark all notifications as read.')
    }

    return data
}