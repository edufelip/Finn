# Onboarding Specification

## Purpose
Introduces new users to the application.

## Functional Requirements
- **FR-ONB-01**: The system shall show an onboarding carousel to first-time users.
- **FR-ONB-02**: The system shall persist the onboarding completion status.
- **FR-ONB-03**: Users shall be able to skip the onboarding flow.

## Use Cases
### UC-ONB-01: Complete Onboarding
1. User opens the app for the first time.
2. User swipes through 3 slides.
3. User clicks "Get Started".
4. System sets `hasSeenOnboarding` to true and navigates to Auth.

## Test Cases
- **TC-ONB-01**: Verify that a returning user who already completed onboarding is not shown the carousel again.

... (existing content) ...