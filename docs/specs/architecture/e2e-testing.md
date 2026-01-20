# End-to-End (E2E) Testing Specification

## Purpose
Defines the high-level user flows verified via automated black-box testing to ensure critical path reliability.

## Toolchain
- **Framework**: Maestro.
- **Platform**: Android & iOS (via emulators/simulators).
- **Automation**: GitHub Actions (`maestro-e2e.yml`).

## Verified Flows (Maestro YAMLs)

### 1. Community Creation & Subscription (`community_create_subscribe.yaml`)
- **Flow**:
    1. Authenticate user.
    2. Navigate to "Create Community".
    3. Enter title, description, and upload icon.
    4. Verify community appears in search.
    5. Subscribe to the new community and verify subscriber count.

### 2. Post Creation (`home_create_post.yaml`)
- **Flow**:
    1. Navigate to "Create Post".
    2. Select a community.
    3. Enter text and select an image.
    4. Submit and verify post appears at the top of the Home feed.

### 3. Profile & Content Viewing (`profile_view.yaml`)
- **Flow**:
    1. Navigate to "Profile".
    2. Verify user stats (Posts, Followers, Following) are displayed.
    3. Switch between "My Posts" and "Communities" tabs.

### 4. Bookmarking (`saved_posts.yaml`)
- **Flow**:
    1. Select a post from the feed.
    2. Click "Save" via the options menu.
    3. Navigate to the "Saved" screen.
    4. Verify the post exists in the saved list.

### 5. Settings & Logout (`settings.yaml`)
- **Flow**:
    1. Navigate to "Settings".
    2. Toggle theme or notification settings.
    3. Perform "Logout".
    4. Verify user is returned to the Auth screen.

## Invariants and Guarantees
- **Reset State**: E2E tests should ideally run on a fresh mock environment or use a clean test user to ensure determinism.
- **Test IDs**: UI components must provide `testID` props for all interactive elements (mapped to `accessibilityLabel` on some platforms).

## Test Cases
- **TC-E2E-01**: Verify that the entire "Post to Saved" cycle completes without errors.
- **TC-E2E-02**: Verify that Guest users are blocked from reaching the "Create Post" screen during E2E navigation.
