# Development & Mock Environment Specification

## Purpose
Provides a consistent and efficient environment for development and automated testing without requiring a live Supabase backend.

## Functional Requirements
- **FR-DEV-01**: The system shall support a "Mock Mode" that uses local static data instead of network requests.
- **FR-DEV-02**: The system shall allow switching between `dev`, `prod`, and `mock` modes via environment variables.
- **FR-DEV-03**: The system shall provide a set of mock repositories that implement the same interfaces as the Supabase repositories.
- **FR-DEV-04**: Mock data shall be deterministic and consistent across app reloads.

## Environment Configurations

### 1. Variables (`.env`)
The application relies on the following environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`: API endpoint for Supabase.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Client-side public key for database access.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`: OAuth ID for iOS.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`: OAuth ID for Android.
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: OAuth ID for web/expo-go.
- `EXPO_PUBLIC_APP_ENV`: Deployment stage (`dev` or `prod`).
- `EXPO_PUBLIC_APP_MODE`: Runtime mode (`mock` or `prod`).

### 2. Mock Mode (`EXPO_PUBLIC_APP_MODE=mock`)
...
- **Repositories**: `repositoryFactory.ts` returns implementations from `src/data/repositories/mock`.
- **Auth**: `AuthProvider` returns a persistent mock session.
- **Latency**: Mock repositories can simulate network delay to test loading states.

### 2. Dev Mode (`EXPO_PUBLIC_APP_MODE=dev`)
- **Backend**: Connects to the development Supabase project.
- **Deep Linking**: Uses `finn-dev://` scheme.
- **Logging**: Increased verbosity in logs.

### 3. Production Mode (`EXPO_PUBLIC_APP_MODE=prod`)
- **Backend**: Connects to the production Supabase project.
- **Deep Linking**: Uses `finn://` scheme.

### 3. Debugging & Logging
- **Supabase Request Logging**: In `__DEV__` mode, the application uses a custom `loggedFetch` wrapper for the Supabase client.
    - **Logic**: Every outbound request (database or storage) and its corresponding response are logged to the console.
    - **Details**: Includes Request Method, URL, Body (for DB requests), Response Status, and Duration (ms).
    - **Privacy**: Headers are intentionally omitted from logs to prevent token exposure.

## Implementation Details (Repository Factory)
The `RepositoryProvider` uses a factory pattern to inject dependencies:
```typescript
const repositories = isMockMode() ? createMockRepositories() : createSupabaseRepositories();
```

## Test Cases
- **TC-DEV-01**: Verify that in Mock Mode, deleting a post (mock) does not affect the live database.
- **TC-DEV-02**: Verify that the app starts successfully in Mock Mode even with no internet connection.

## Terminology
- **Mock Repository**: A class that implements a domain repository interface using in-memory data.
- **Environment Variable**: Configuration values loaded from `.env` files.
