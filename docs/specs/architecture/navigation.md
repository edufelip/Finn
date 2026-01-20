# Navigation Specification

## Overview
The application uses React Navigation to manage transitions between screens.

## Functional Requirements
- **FR-NAV-01**: The system shall provide a Drawer navigator for primary navigation.
- **FR-NAV-02**: The system shall provide a Bottom Tab navigator for main feature access.
- **FR-NAV-03**: The system shall restrict access to internal screens for unauthenticated users (unless in Guest Mode).
- **FR-NAV-04**: The system shall support deep links to specific content.

## Use Cases
### UC-NAV-01: Navigate to Post Detail
1. User clicks a post card in the Home feed (either Communities or People tab).
2. System pushes the `PostDetail` screen onto the navigation stack with the `postId`.
3. User sees the full post content and comments.

### UC-NAV-02: Switch Home Tabs
1. User taps the “People” tab in Home.
2. System animates the indicator and slides content to show posts from followed users.
3. If the user is a guest, the People tab shows a guest empty state and sign-in prompt.

### UC-NAV-03: Self-Profile Redirection
1. User attempts to navigate to a user's profile from a post or list.
2. System detects if the target user ID is the current user's ID.
3. System redirects the navigation to the "Profile" tab instead of opening a generic `UserProfile` screen.

### UC-NAV-04: Navigate to Chat
1. User taps the message icon on a `UserProfile` screen.
2. System pushes the `Chat` screen onto the navigation stack with `userId` and `user` data.

## Navigation Hierarchy
- **MainStack**: Root stack containing the Drawer and secondary screens.
    - `DrawerRoot`: Home for the Drawer navigator.
        - `Tabs`: Main bottom tab navigator (`Home`, `Explore`, `Add`, `Inbox`, `Profile`).
    - `UserProfile`: Generic profile viewer for other users.
    - `Chat`: Direct message interface.
    - `PostDetail`: Full post view.
    - ... (secondary screens)
