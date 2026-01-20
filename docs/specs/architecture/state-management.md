# Architecture & State Management Specification

## Overview
The "finn" application follows a Clean Architecture approach with a unidirectional data flow.

## Functional Requirements
- **FR-ARCH-01**: The system shall separate business logic (Domain) from data access (Data) and UI (Presentation).
- **FR-ARCH-02**: The system shall use global stores (Zustand) to manage shared application state.
- **FR-ARCH-03**: The system shall use Repositories as the single source of truth for data fetching.

## Use Cases
### UC-ARCH-01: Update Global User State
1. AuthProvider detects a new session.
2. AuthProvider fetches the user profile via UserRepository.
3. AuthProvider updates the `userStore` with the new profile.
4. All screens observing `userStore` re-render with the new user data.

## Test Cases
- **TC-ARCH-01**: Verify that repository methods are injected via a Provider to allow for easy mocking in tests.
- **TC-ARCH-02**: Verify that local cache is updated after successful remote writes to maintain consistency.

... (existing content) ...