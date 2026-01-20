# Community Moderation Specification

## Purpose
Enables community management via delegated roles and audit trails.

## Functional Requirements
...
- **FR-MOD-06**: The system shall display real-time badge counts for pending and reported content on the community management screen.

## Performance Requirements
- **PR-MOD-01**: Badge counts for pending posts and reports shall be loaded in parallel (using `Promise.all`) to ensure fast screen loading times.
- **PR-MOD-02**: Complex list items (like Report Cards) shall use `React.memo` to prevent unnecessary re-renders during state updates.

## Use Cases

...

### UC-MOD-02: Add a Moderator

1. Community owner navigates to "Manage Moderators".

2. Owner clicks "Add Moderator".

3. System displays a native `Alert.prompt` (iOS/Android).

4. Owner enters the user ID and confirms.

5. System validates ID, adds the moderator, and refreshes the list.



## Test Cases

- **TC-MOD-01**: Verify that a regular member cannot see the "Pending Content" button.

- **TC-MOD-02**: Verify that removing a moderator immediately revokes their access to moderation tools.

- **TC-MOD-03**: Verify that only the community owner can remove other moderators.



## Terminology

...
