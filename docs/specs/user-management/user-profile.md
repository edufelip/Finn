# User Profile Specification

## Purpose
Manages user identity, profile information, social connections, and visibility settings.

## Functional Requirements
- **FR-PROF-01**: Users shall be able to view their own profile and others' profiles.
- **FR-PROF-02**: Users shall be able to edit their profile with the following validations:
    - Name is required.
    - Bio is optional but must be 300 characters or less.
- **FR-PROF-03**: Users shall be able to update their profile photo via camera or gallery.
- **FR-PROF-04**: The system shall display follower and following counts on the profile.
- **FR-PROF-05**: Users shall be able to delete their account permanently.
- **FR-PROF-06**: Users shall be able to toggle their online visibility status.
- **FR-PROF-07**: Users shall be able to toggle global push notification preferences.

## Use Cases
### UC-PROF-01: Update Profile Info
...
### UC-PROF-03: View Profile Header (Drawer)
1. User opens the navigation drawer.
2. System fetches the user profile and saved posts count.
3. System displays the user's name, email, and avatar.
4. System displays a badge with the count of saved posts.
5. System displays a real-time status indicator (online/offline).

## Test Cases
...

## Data Structures
... (existing content) ...