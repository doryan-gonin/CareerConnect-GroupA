# Sprint 3 Contribution & Activity Log

* **Team Member**: Ron Rozenberg
* **Role**: Frontend Development / Manual Testing
* **Project**: CareerConnect (SOEN 341 - Fall 2026)
* **Sprint**: Sprint 3
* **Feature**: Notifications frontend
* **Work period**: November 12–16, 2026
* **Total estimated time spent**: Approximately 3 hours
* **Working branch**: `Notifications_UI`

## Detailed Activity Breakdown

| # | Activity / Description | References |
|---|---|---|
| 1 | **Connect the frontend to the notification API.** Added authenticated requests to list notifications, mark one or all as read, and delete a notification. Reused the existing API base URL and Bearer token pattern. | `src/frontend/src/api/notification.js` |
| 2 | **Build the notification dropdown.** Added a Notifications button to the main dashboard navbar and passed the login token from the app to the component. Displayed the unread count, notification titles and messages, and a highlight for unread items. | `App.jsx`, `Navbar.jsx`, `NotificationBell.jsx` |
| 3 | **Add notification controls.** Added buttons to mark an item as read, mark all as read, and delete an item. Refreshed the list and count after successful updates so the changes can appear while the dropdown stays open. | `NotificationBell.jsx`, `notification.js` |
| 4 | **Debug the dropdown.** Fixed JSX and hook placement issues, corrected a variable name that caused the page to go blank when a notification loaded, and anchored the dropdown beneath the button. Matched the button's styling to the other navbar links. | `Navbar.jsx`, `NotificationBell.jsx` |
| 5 | **Test the notification flow locally.** Created a test posting as a recruiter, applied as a job seeker, and updated the application status. Confirmed that a notification appeared on the job seeker dashboard and the unread count updated. | Local browser test |

## Summary of Deliverables

- Notification API helpers and dropdown for the main dashboard navbar.
- Local browser verification that a recruiter status change produces a visible notification for the job seeker.
- Request methods and paths for the read and delete actions checked against the existing backend routes. Full browser verification of all actions was not recorded.
