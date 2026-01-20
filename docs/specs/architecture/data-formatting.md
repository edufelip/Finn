# Data Formatting Specification

## Purpose
Ensures that data is presented to the user in a consistent, readable, and localized format across all screens.

## Functional Requirements
- **FR-FORM-01**: The system shall format dates as "Month Year" for historical context (e.g., "Member since January 2026").
- **FR-FORM-02**: The system shall provide "Time Ago" relative formatting for posts and comments (e.g., "2 hours ago").
- **FR-FORM-03**: The system shall format large numbers using compact notation (e.g., "1.2k" instead of "1200").
- **FR-FORM-04**: The system shall mask sensitive user data (e.g., emails) in confirmation dialogs.

## Formatting Rules

### 1. Relative Time (formatTimeAgo)
- Uses `Intl.RelativeTimeFormat`.
- Thresholds: 
    - < 60s: "seconds ago"
    - < 60m: "minutes ago"
    - < 24h: "hours ago"
    - < 7d: "days ago"
    - > 4w: "months ago"
    - > 1y: "years ago"

### 2. Compact Numbers (formatCompactNumber)
- Notation: `compact`.
- Precision: Maximum 1 fraction digit.

### 3. Email Masking (maskEmail)
- Logic: Keeps the first character of the local part, replaces the rest with `***`, and keeps the domain intact.
- Example: `j***@example.com`.

## Invariants and Guarantees
- **Locale Sync**: All formatters consume the locale from the `i18n` configuration.
- **Robustness**: Formatters must handle invalid input (null, undefined, invalid dates) by returning an empty string or a safe fallback.

## Test Cases
- **TC-FORM-01**: Verify that exactly 1000 is formatted as "1K".
- **TC-FORM-02**: Verify that a date from 2 years ago is correctly pluralized as "2 years ago".
