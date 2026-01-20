# External Links & WebView Specification

## Purpose
Provides a way for users to access external content (e.g., Privacy Policy, Terms of Service) without leaving the application context.

## Functional Requirements
- **FR-EXTL-01**: The system shall open specific external URLs within an in-app `WebView`.
- **FR-EXTL-02**: The system shall support opening URLs in the device's default system browser.
- **FR-EXTL-03**: The in-app `WebView` shall display a loading indicator while the content is fetching.
- **FR-EXTL-04**: The system shall provide clear feedback if an external link fails to load.

## Use Cases
### UC-EXTL-01: View Privacy Policy
1. User navigates to Settings.
2. User clicks "Privacy Policy".
3. System opens `WebViewScreen` with the PDF URL.
4. User reads the document and clicks "Back" to return to the app.

### UC-EXTL-02: Open System Settings
1. User receives an alert that notifications are disabled.
2. User clicks "Open Settings".
3. System invokes `Linking.openSettings()` to transition the user to the OS settings app.

## Test Cases
- **TC-EXTL-01**: Verify that the `WebView` displays an error message if the URL is unreachable.
- **TC-EXTL-02**: Verify that navigation within the `WebView` does not affect the main app navigation stack.

## Terminology
- **WebView**: A component that renders web content inside the app.
- **In-App Browser**: A browser instance that appears over the app but is managed by the OS (e.g., Safari View Controller).
