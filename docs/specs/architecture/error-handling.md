# Error Handling Specification

## Purpose
Ensures a consistent user experience when dealing with errors.

## Functional Requirements
- **FR-ERR-01**: The system shall validate form inputs before submission.
- **FR-ERR-02**: The system shall display user-friendly alerts for network and API failures.
- **FR-ERR-03**: The system shall guard restricted features behind authorization checks.

## Use Cases
### UC-ERR-01: Handle API Failure
1. User attempts to like a post.
2. The network request fails.
3. System displays an `Alert.alert` with an error message.

## Test Cases
- **TC-ERR-01**: Verify that unauthorized users are redirected back with an alert when trying to access moderation screens.
- **TC-ERR-02**: Verify that empty required fields in the "Create Community" screen trigger validation alerts.

... (existing content) ...