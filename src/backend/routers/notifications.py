from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func, col

from backend.database import get_session
from backend.models import (
    User,
    Notification,
    NotificationResponse,
    NotificationListResponse,
)
from backend.dependencies import get_current_user

router = APIRouter(tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
def get_my_notifications(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
    unread_only: bool = Query(default=False, description="Filter only unread notifications"),
    limit: int = Query(default=50, ge=1, le=100, description="Max number of notifications to return"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
):
    """
    Retrieve notifications for the current authenticated user.
    Ordered by creation date descending.
    """
    base_query = select(Notification).where(Notification.user_id == current_user.id)

    # Calculate total and unread counts for this user
    total_count = session.exec(
        select(func.count(Notification.id)).where(Notification.user_id == current_user.id)
    ).one()

    unread_count = session.exec(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id,
            not Notification.is_read, 
        )
    ).one()

    query = base_query
    if unread_only:
        query = query.where(not Notification.is_read)

    query = query.order_by(col(Notification.created_at).desc()).offset(offset).limit(limit)
    items = session.exec(query).all()

    return NotificationListResponse(
        total_count=total_count,
        unread_count=unread_count,
        notifications=[
            NotificationResponse(
                id=item.id,
                user_id=item.user_id,
                title=item.title,
                message=item.message,
                notification_type=item.notification_type,
                is_read=item.is_read,
                created_at=item.created_at,
                reference_id=item.reference_id,
                reference_type=item.reference_type,
            )
            for item in items
        ],
    )


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Mark a specific notification as read."""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this notification.",
        )

    notification.is_read = True
    session.add(notification)
    session.commit()
    session.refresh(notification)

    return NotificationResponse(
        id=notification.id,
        user_id=notification.user_id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.notification_type,
        is_read=notification.is_read,
        created_at=notification.created_at,
        reference_id=notification.reference_id,
        reference_type=notification.reference_type,
    )


@router.patch("/read-all", status_code=status.HTTP_200_OK)
def mark_all_notifications_as_read(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Mark all unread notifications for the current user as read."""
    notifications = session.exec(
        select(Notification).where(
            Notification.user_id == current_user.id,
            not Notification.is_read,
        )
    ).all()

    for item in notifications:
        item.is_read = True
        session.add(item)

    session.commit()
    return {"message": f"Marked {len(notifications)} notification(s) as read."}


@router.delete("/{notification_id}", status_code=status.HTTP_200_OK)
def delete_notification(
    notification_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete a specific notification."""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this notification.",
        )

    session.delete(notification)
    session.commit()
    return {"message": "Notification deleted successfully."}

