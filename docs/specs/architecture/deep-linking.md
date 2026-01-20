# Deep Linking & Sharing Specification

## Purpose
Connects external links to internal app content.

## Functional Requirements
- **FR-LINK-01**: The system shall generate Universal Links for posts and communities.
- **FR-LINK-02**: The system shall respond to incoming Universal Links and navigate to the target resource.
- **FR-LINK-03**: The system shall support a custom URL scheme (`finn://`).

## Use Cases
### UC-LINK-01: Share a Post
1. User clicks "Share" on a post.
2. System generates `https://finn.app/post/{id}`.
3. User sends link to a friend.
4. Friend clicks link; if app is installed, it opens to the post detail screen.

## Test Cases
- **TC-LINK-01**: Verify that clicking a `finn://community/123` link opens the correct community screen.
- **TC-LINK-02**: Verify that sharing a post with no content uses a fallback message.

## URL Structures

### Prefixes
- `finn://`
- `https://finn.app`
- `https://*.finn.app`

### Screen Mappings
- **Onboarding**: `/onboarding`
- **Login**: `/login`
- **Register**: `/register`
- **Forgot Password**: `/forgot-password`
- **Post Detail**: `/post/:postId`
- **Community Detail**: `/community/:communityId`

## Invariants and Guarantees
- **Fallthrough**: Universal links are designed to fall back to the web browser if the app is not installed (though the web implementation is out of scope for this spec).
- **Environment Scheme**: Development builds automatically use `finn-dev://` while production uses `finn://`.