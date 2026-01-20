# Notifications Specification

## Purpose
Informs users about activities related to their account and content, such as new followers, likes, and comments.

## Functional Requirements
- **FR-NOTI-01**: The system shall fetch a list of notifications for the authenticated user.
- **FR-NOTI-02**: The system shall allow users to mark individual notifications as read.
- **FR-NOTI-03**: The system shall allow users to mark all notifications as read at once.
- **FR-NOTI-04**: The system shall support different notification types: `follow`, `post_like`, `post_comment`.
- **FR-NOTI-05**: The system shall register the device's push token for remote notifications.

## Use Cases
### UC-NOTI-01: View Notifications
1. User navigates to the Inbox/Notifications tab.
2. System fetches notifications from the repository.
3. System displays a list of notifications with actor names and action descriptions.
4. User sees unread notifications highlighted.

### UC-NOTI-02: Mark All as Read
1. User clicks "Mark all as read" in the notifications screen.
2. System updates all unread notifications for the user in the database.
3. UI updates to reflect all notifications as read.

## Test Cases
- **TC-NOTI-01**: Verify that clicking a notification correctly marks it as read in the database.
- **TC-NOTI-02**: Verify that notifications for deleted posts are handled gracefully.
- **TC-NOTI-03**: Verify that push token registration only happens if the user grants notification permissions.

## Automation Logic (Database Triggers)
Notifications are created automatically on the server:
- **New Follower**: Triggered by `user_follows` insertion.
- **New Like**: Triggered by `likes` insertion.
- **New Comment**: Triggered by `comments` insertion.
    - **Metadata**: Includes a `comment_preview` truncated to **140 characters**.

## Foreground Handling
The system employs a specific behavior for notifications received while the app is actively in use:
- **Notification Gate**: The system determines if an alert/banner should be shown based on the user's current preference.
- **Preference Sync**: If notifications are disabled in Settings, foreground alerts are suppressed and existing notifications are dismissed from the system tray.

## Terminology
- **Actor**: The user who triggered the event.
- **Recipient**: The user who receives the notification.