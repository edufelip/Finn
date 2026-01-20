# Guest Mode Specification

## Purpose
Provides a friction-less "browse-first" experience for unauthenticated users.

## Functional Requirements
- **FR-GUST-01**: The system shall allow unauthenticated users to enter "Guest Mode".
- **FR-GUST-02**: The system shall allow guests to view feeds and community profiles.
- **FR-GUST-03**: The system shall display visual cues indicating restricted access.
- **FR-GUST-04**: The system shall intercept restricted actions with a "Sign In Required" gate.

## Visual Indicators
The UI provides explicit feedback to guest users:
- **Tab Bar FAB**: Displays a **lock icon** instead of an "add" icon.
- **Create Sheet**: Interactive cards (Community/Post) display a **lock badge** and reduced opacity.
- **Home Feed**: Displays a persistent banner prompting for sign-in.

## Use Cases
### UC-GUST-01: Attempting Restricted Action
1. Guest user clicks the "Like" button.
2. System displays a "Sign in required" alert.
3. User is redirected to Auth upon confirmation.

## Implementation Details
- **Guest Guards**: `useAuth` provides the `isGuest` flag for conditional rendering and logic.
- **GuestGateScreen**: Replaces full screens (e.g., Inbox) when accessed by a guest.