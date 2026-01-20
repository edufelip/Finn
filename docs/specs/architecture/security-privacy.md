# Security & Data Privacy Specification

## Purpose
Defines the measures taken to protect user data and ensure compliance with privacy standards.

## Functional Requirements
- **FR-SECU-01**: The system shall use Row Level Security (RLS) to restrict data access at the database level.
- **FR-SECU-02**: The system shall protect sensitive authentication tokens using secure device storage.
- **FR-SECU-03**: The system shall provide a clear Privacy Policy accessible to all users.
- **FR-SECU-04**: The system shall ensure that server-side file deletion is authorized and limited to the user's own data.

## Security Mechanisms

### 1. Database Security (RLS)
- **Policies**: Every table has RLS enabled.
- **Authenticated Access**: Most `SELECT` policies require `to authenticated`.
- **Ownership Verification**: `UPDATE` and `DELETE` policies verify `auth.uid() = user_id` or `auth.uid() = owner_id`.
- **Service Role**: Edge Functions use the `service_role` key only for administrative tasks (like cleanup) after manual authorization checks.

### 2. Client-Side Security
- **SecureStore**: Sensitive data (though currently mostly handled by Supabase Auth) uses `expo-secure-store` for hardware-encrypted storage.
- **Session Persistence**: Handled by `@supabase/supabase-js` using standard secure storage adapters.

### 3. Data Privacy
- **Privacy Policy**: A public PDF link is hosted at the URL defined in `src/config/links.ts`.
- **Account Deletion**: Users have the right to be forgotten. Account deletion triggers a complete cascade of data and file removal (see `user-profile.md`).

## Use Cases
### UC-SECU-01: Unauthorized Update Attempt
1. User A attempts to update a post belonging to User B via a direct API call.
2. Supabase RLS policy `posts_update_own` evaluates `auth.uid() = user_id`.
3. The database rejects the operation (0 rows updated), and the API returns an error.

## Test Cases
- **TC-SECU-01**: Verify that a guest user cannot access any table that requires `to authenticated`.
- **TC-SECU-02**: Verify that the `delete-user-assets` function rejects requests where the JWT subject does not match the `userId` payload.

## Terminology
- **RLS**: Row Level Security.
- **JWT**: JSON Web Token.
- **Service Role Key**: A bypass key for administrative tasks (must never be exposed to the client).
