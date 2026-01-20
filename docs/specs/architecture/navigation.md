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
1. User clicks a post card in the Home feed.
2. System pushes the `PostDetail` screen onto the navigation stack with the `postId`.
3. User sees the full post content and comments.

## Test Cases
- **TC-NAV-01**: Verify that guests are prompted to sign in when trying to access the "Inbox" or "Create" tabs.
- **TC-NAV-02**: Verify that deep links (e.g., `finn://post/123`) correctly open the corresponding post.

... (existing content) ...