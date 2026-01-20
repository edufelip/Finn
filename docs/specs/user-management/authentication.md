# Authentication Specification

## Purpose
Manages user sessions, authentication states (Authenticated, Guest, Mock), and ensures that user profiles are synchronized with the session.

## Functional Requirements
- **FR-AUTH-01**: The system shall support email/password registration with the following validations:
    - Name is required.
    - Email is required and must follow a valid email format.
    - Password is required.
    - Password confirmation must match the password.
- **FR-AUTH-02**: The system shall support email/password login with the following validations:
    - Email is required.
    - Password is required.
- **FR-AUTH-03**: The system shall support third-party OAuth providers (Google, Apple).
...
- **FR-AUTH-07**: The system shall support password recovery via email, requiring a valid email address.
- **FR-AUTH-08**: The system shall support Mock Mode for development without external dependencies.

## Use Cases
### UC-AUTH-01: Sign Up with Email
1. User enters name, email, and password.
2. User submits the form.
3. System validates input.
4. System calls Supabase Auth to create account.
5. System triggers "Check Email" alert.
6. Database trigger creates profile record.

### UC-AUTH-02: Browse as Guest
1. User selects "Continue as Guest" on the Auth screen.
2. System sets `isGuest` to true and persists the flag.
3. User is navigated to the Home feed.

### UC-AUTH-03: Sign In with Google
1. User selects "Sign in with Google".
2. System initiates OAuth flow.
3. Upon success, system retrieves identity token.
4. System establishes Supabase session and synchronizes profile.

## Test Cases
- **TC-AUTH-01**: Verify that submitting an invalid email format triggers a validation alert.
- **TC-AUTH-02**: Verify that a user can successfully log out and is returned to the Auth screen.
- **TC-AUTH-03**: Verify that entering Guest Mode hides protected actions (e.g., "Create Post").
- **TC-AUTH-04**: Verify that a user's session is restored when the app is force-closed and reopened.

## Terminology
- **Session**: A valid authentication token and user data from Supabase.
- **Guest Mode**: A state where the user can browse content without an account.
- **Mock Mode**: A development state where a fake session is always active.

## Authentication States
... (existing content) ...