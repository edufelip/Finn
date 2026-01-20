# Theming Specification

## Purpose
Defines the visual design system of the application.

## Functional Requirements
- **FR-THME-01**: The system shall support Light and Dark color themes.
- **FR-THME-02**: The system shall allow users to choose between System, Light, and Dark preferences.
- **FR-THME-03**: The system shall persist the theme preference across app restarts.
- **FR-THME-04**: The system shall provide standardized spacing and border radius metrics.

## Use Cases
### UC-THME-01: Switch to Dark Mode
1. User navigates to Settings.
2. User selects "Dark Mode".
3. System updates the global theme context and persists the preference.
4. All UI components re-render with dark colors.

## Test Cases
- **TC-THME-01**: Verify that choosing "System" correctly follows the OS-level theme change.
- **TC-THME-02**: Verify that the status bar color changes automatically based on the theme.

... (existing content) ...