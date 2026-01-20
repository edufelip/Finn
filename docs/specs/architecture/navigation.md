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

## Test Cases
- **TC-NAV-01**: Verify that guests are prompted to sign in when trying to access the "Inbox" or "Create" tabs.
- **TC-NAV-02**: Verify that deep links (e.g., `finn://post/123`) correctly open the corresponding post.

... (existing content) ...
