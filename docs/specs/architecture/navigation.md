# Navigation Specification

## Overview
The application uses React Navigation (v6) to manage screen transitions and navigation flow. The architecture consists of a native stack navigator containing a drawer navigator, which in turn contains a bottom tab navigator for primary features.

## Functional Requirements
- **FR-NAV-01**: The system shall provide a Drawer navigator for primary navigation and user menu.
- **FR-NAV-02**: The system shall provide a Bottom Tab navigator for main feature access (5 tabs).
- **FR-NAV-03**: The system shall restrict access to internal screens for unauthenticated users (unless in Guest Mode).
- **FR-NAV-04**: The system shall support deep links to specific content (posts, communities, profiles, chats).
- **FR-NAV-05**: The system shall provide type-safe navigation with TypeScript param lists.
- **FR-NAV-06**: All screens shall hide the header by default (headerShown: false).

## Navigation Hierarchy

### MainStack (Root Level)
**Location**: `src/presentation/navigation/MainStack.tsx`

**Type**: Native Stack Navigator

**Screens**:
1. **DrawerRoot** - Root of drawer navigator (no params)
2. **CreatePost** - Create new post (optional communityId)
3. **CreateCommunity** - Create new community (no params)
4. **CommunityDetail** - View community (communityId, optional initialCommunity)
5. **SavedPosts** - User's saved posts (no params)
6. **Settings** - App settings (no params)
7. **EditProfile** - Edit user profile (no params)
8. **PostDetail** - View post with comments (post or postId)
9. **Profile** - Current user's profile (no params)
10. **Notifications** - Notification feed (no params)
11. **SearchResults** - Search communities (optional focus, sort, topicId)
12. **WebView** - In-app browser (title, url)
13. **UserProfile** - View other user's profile (userId)
14. **Chat** - Direct message screen (userId, optional user, threadId, isRequest)

**Moderation Screens** (Added in community moderation feature):
15. **EditCommunity** - Edit community settings (communityId)
16. **PendingContent** - Review pending posts (communityId)
17. **ReportedContent** - Review reported posts (communityId)
18. **ModerationLogs** - View audit trail (communityId)
19. **ManageModerators** - Manage moderators (communityId)

### Type Definition
```typescript
export type MainStackParamList = {
  DrawerRoot: undefined;
  CreatePost: { communityId?: number } | undefined;
  CreateCommunity: undefined;
  CommunityDetail: { communityId: number; initialCommunity?: Community };
  SavedPosts: undefined;
  Settings: undefined;
  EditProfile: undefined;
  PostDetail: { post?: Post; postId?: number };
  Profile: undefined;
  Notifications: undefined;
  SearchResults: { focus?: boolean; sort?: SearchSort; topicId?: number } | undefined;
  WebView: { title: string; url: string };
  EditCommunity: { communityId: number };
  PendingContent: { communityId: number };
  ReportedContent: { communityId: number };
  ModerationLogs: { communityId: number };
  ManageModerators: { communityId: number };
  UserProfile: { userId: string };
  Chat: { userId: string; user?: User; threadId?: string; isRequest?: boolean };
};
```

### DrawerNavigator (Second Level)
**Location**: `src/presentation/navigation/MainDrawer.tsx`

**Type**: Drawer Navigator

**Screens**:
- **Tabs** - Bottom tab navigator (primary screen)
- Drawer items link to MainStack screens (Settings, Profile, etc.)

### TabNavigator (Third Level)
**Location**: `src/presentation/navigation/TabNavigator.tsx`

**Type**: Bottom Tab Navigator

**Tabs**:
1. **Home** - Feed screen (Communities + People tabs)
2. **Explore** - Discover new content
3. **Add** - Quick post creation (modal-style)
4. **Inbox** - Messages and chat threads
5. **Profile** - Current user's profile

## Use Cases

### UC-NAV-01: Navigate to Post Detail
1. User views post in Home feed (Communities or People tab).
2. User taps on the post card.
3. System calls `navigation.navigate('PostDetail', { postId })`.
4. System pushes PostDetailScreen onto MainStack.
5. User sees full post content with comments section.
6. User can tap back button to return to feed.

### UC-NAV-02: Switch Home Feed Tabs
1. User is on Home screen viewing Communities tab.
2. User taps "People" tab header.
3. System animates tab indicator to People position.
4. System displays posts from followed users (following feed).
5. If user is guest, system shows guest empty state with sign-in prompt.

### UC-NAV-03: Self-Profile Redirection
1. User views their own post in feed.
2. User taps on their username or avatar.
3. System detects target userId matches current user's ID.
4. System calls `navigation.navigate('Profile')` instead of `UserProfile`.
5. User lands on Profile tab (not a new screen on stack).
6. Preserves tab bar visibility.

### UC-NAV-04: Navigate to Chat
1. User views another user's profile via `UserProfile` screen.
2. User taps message icon in header.
3. System calls `navigation.navigate('Chat', { userId, user })`.
4. System pushes ChatScreen onto MainStack.
5. User sees direct message interface.
6. Existing thread loads if available, new thread created otherwise.

### UC-NAV-05: Create Post with Pre-selected Community
1. User views CommunityDetailScreen.
2. User taps floating "Add Post" button.
3. System calls `navigation.navigate('CreatePost', { communityId })`.
4. CreatePostScreen opens with community pre-selected.
5. Community dropdown is disabled (can't change).
6. User writes post and submits.
7. System returns to CommunityDetailScreen after success.

### UC-NAV-06: Navigate to Moderation Screens
1. Community owner opens EditCommunityScreen.
2. Owner taps "Pending Content" moderation button.
3. System calls `navigation.navigate('PendingContent', { communityId })`.
4. PendingContentScreen opens showing pending posts.
5. Owner can navigate back to EditCommunity.
6. Similar flow for other moderation screens.

### UC-NAV-07: Deep Link to Post
1. User taps deep link: `finn://post/12345`.
2. System parses URL and extracts postId.
3. System checks if user is authenticated.
4. System navigates: `MainStack → DrawerRoot → PostDetail`.
5. System calls `navigation.navigate('PostDetail', { postId: 12345 })`.
6. User sees post detail screen.

### UC-NAV-08: Search with Filters
1. User taps search icon in header.
2. System calls `navigation.navigate('SearchResults', { focus: true })`.
3. SearchScreen opens with search input auto-focused.
4. User applies topic filter.
5. System updates URL params: `{ focus: false, topicId: 5 }`.
6. SearchScreen re-renders with filtered results.

### UC-NAV-09: Open External Link
1. User taps external link in post content.
2. System detects URL is external (not finn://).
3. System calls `navigation.navigate('WebView', { title, url })`.
4. In-app browser opens with external content.
5. User can navigate back to post.
6. Keeps user within app (no external browser).

### UC-NAV-10: Guest Mode Navigation Restrictions
1. Guest user taps "Create Post" button.
2. System checks authentication state (guest mode).
3. System shows GuestGateAlert modal.
4. Guest can sign up/sign in or dismiss.
5. If dismissed, navigation is cancelled.
6. Certain screens remain accessible (Home, Explore, PostDetail).

## Screen Details

### Primary Screens (Always Accessible)

**Home** (Tab):
- Feed screen with two tabs (Communities, People)
- Communities: Posts from subscribed communities
- People: Posts from followed users
- Guest mode: Shows public feed with limited features

**Explore** (Tab):
- Discover new content (trending, recommended)
- Topic-based browsing
- Guest mode: Fully accessible

**Profile** (Tab):
- Current user's profile
- Three tabs: Posts, Comments, My Communities
- Guest mode: Shows guest prompt

**Inbox** (Tab):
- Chat threads and message requests
- Three tabs: Primary, Requests, Archived
- Guest mode: Restricted (guest gate)

### Secondary Screens (Stack Navigation)

**CreatePost**:
- Params: `{ communityId?: number }`
- Modal-style presentation
- Pre-selects community if communityId provided
- Guest restriction: Yes

**CommunityDetail**:
- Params: `{ communityId: number; initialCommunity?: Community }`
- Shows community header, posts, moderation buttons (if owner/mod)
- Optional initialCommunity for optimistic rendering
- Guest restriction: No (read-only)

**PostDetail**:
- Params: `{ post?: Post; postId?: number }`
- Full post with comments section
- Optional post object for optimistic rendering
- Guest restriction: No (read-only), commenting restricted

**UserProfile**:
- Params: `{ userId: string }`
- Shows other user's profile (not current user)
- Three tabs: Posts, Comments, Followers/Following
- Guest restriction: No (read-only)

**SearchResults**:
- Params: `{ focus?: boolean; sort?: SearchSort; topicId?: number }`
- Community search with filters
- Focus: Auto-focus search input on mount
- Sort: Pre-apply sort order
- TopicId: Pre-apply topic filter
- Guest restriction: No

**Chat**:
- Params: `{ userId: string; user?: User; threadId?: string; isRequest?: boolean }`
- Direct message interface
- Loads existing thread or creates new one
- Guest restriction: Yes

### Moderation Screens (Owner/Moderator Only)

**EditCommunity**:
- Params: `{ communityId: number }`
- Edit community settings (cover, description, permissions)
- Moderation navigation hub (4 buttons with badges)
- Authorization: Owner only
- Guest restriction: Yes

**PendingContent**:
- Params: `{ communityId: number }`
- Queue of posts awaiting approval
- Approve/Reject actions
- Authorization: Owner or moderator
- Guest restriction: Yes

**ReportedContent**:
- Params: `{ communityId: number }`
- Queue of reported posts
- Delete/Mark Safe actions
- Authorization: Owner or moderator
- Guest restriction: Yes

**ModerationLogs**:
- Params: `{ communityId: number }`
- Read-only audit trail
- Shows all moderation actions
- Authorization: Owner or moderator (read-only)
- Guest restriction: Yes

**ManageModerators**:
- Params: `{ communityId: number }`
- List of moderators
- Add/Remove actions (owner only)
- Authorization: Owner can edit, moderators can view
- Guest restriction: Yes

### Utility Screens

**Settings**:
- App settings, theme, language, notifications
- Guest restriction: Partial (some settings available)

**EditProfile**:
- Edit user profile (name, bio, avatar)
- Guest restriction: Yes

**SavedPosts**:
- User's saved/bookmarked posts
- Guest restriction: Yes

**Notifications**:
- Notification feed
- Guest restriction: Yes

**WebView**:
- Params: `{ title: string; url: string }`
- In-app browser for external links
- Guest restriction: No

**CreateCommunity**:
- Create new community form
- Guest restriction: Yes

## Navigation Flow Diagrams

### Main Navigation Flow
```
App Start
  ↓
MainStack
  ↓
DrawerRoot (Drawer Navigator)
  ↓
Tabs (Bottom Tab Navigator)
  ├── Home (Feed)
  ├── Explore (Discover)
  ├── Add (Create Post Modal)
  ├── Inbox (Messages)
  └── Profile (User Profile)
```

### Post Detail Flow
```
Home Feed
  ↓ (tap post)
PostDetail (MainStack)
  ↓ (tap user avatar)
UserProfile (MainStack)
  ↓ (tap message icon)
Chat (MainStack)
```

### Community Moderation Flow
```
Profile Tab
  ↓ (My Communities tab)
ManagedCommunityCard
  ↓ (tap Manage)
EditCommunity (MainStack)
  ↓ (tap moderation button)
PendingContent / ReportedContent / ModerationLogs / ManageModerators
  ↓ (back button)
EditCommunity
  ↓ (back button)
Profile Tab
```

### Search and Discovery Flow
```
Explore Tab
  ↓ (tap community card)
CommunityDetail (MainStack)
  ↓ (tap subscribe)
(Updates communityStore)
  ↓ (back button)
Explore Tab
```

## Test Cases

### Navigation
- **TC-NAV-01**: Verify PostDetail screen receives correct postId param.
- **TC-NAV-02**: Verify CommunityDetail screen receives correct communityId param.
- **TC-NAV-03**: Verify UserProfile screen receives correct userId param.
- **TC-NAV-04**: Verify Chat screen receives correct userId param.
- **TC-NAV-05**: Verify CreatePost pre-selects community when communityId provided.

### Moderation Navigation
- **TC-NAV-06**: Verify EditCommunity screen receives correct communityId.
- **TC-NAV-07**: Verify PendingContent navigates from EditCommunity.
- **TC-NAV-08**: Verify ReportedContent navigates from EditCommunity.
- **TC-NAV-09**: Verify ModerationLogs navigates from EditCommunity.
- **TC-NAV-10**: Verify ManageModerators navigates from EditCommunity.

### Self-Profile Redirection
- **TC-NAV-11**: Verify tapping own username navigates to Profile tab (not UserProfile).
- **TC-NAV-12**: Verify tapping other user navigates to UserProfile screen.
- **TC-NAV-13**: Verify Profile tab remains selected after self-profile redirection.

### Guest Mode
- **TC-NAV-14**: Verify guest users see GuestGateAlert when accessing CreatePost.
- **TC-NAV-15**: Verify guest users can access Home, Explore, PostDetail.
- **TC-NAV-16**: Verify guest users cannot access Chat, Inbox, CreateCommunity.
- **TC-NAV-17**: Verify guest users cannot access moderation screens.

### Deep Links
- **TC-NAV-18**: Verify deep link to post navigates to PostDetail.
- **TC-NAV-19**: Verify deep link to community navigates to CommunityDetail.
- **TC-NAV-20**: Verify deep link to profile navigates to UserProfile.
- **TC-NAV-21**: Verify deep link to chat navigates to Chat.

### Back Navigation
- **TC-NAV-22**: Verify back button from PostDetail returns to previous screen.
- **TC-NAV-23**: Verify back button from UserProfile returns to previous screen.
- **TC-NAV-24**: Verify back button from moderation screens returns to EditCommunity.
- **TC-NAV-25**: Verify back button from EditCommunity returns to Profile tab.

### Tab Navigation
- **TC-NAV-26**: Verify switching tabs preserves stack state.
- **TC-NAV-27**: Verify tapping active tab scrolls to top (if implemented).
- **TC-NAV-28**: Verify tab bar visible on tab screens, hidden on stack screens.

### Authorization
- **TC-NAV-29**: Verify non-owners cannot navigate to EditCommunity.
- **TC-NAV-30**: Verify non-moderators cannot navigate to PendingContent.
- **TC-NAV-31**: Verify non-moderators cannot navigate to ReportedContent.
- **TC-NAV-32**: Verify unauthorized users redirected with error message.

## Performance Requirements
- **PR-NAV-01**: Screen transitions shall complete within 300ms.
- **PR-NAV-02**: Deep link navigation shall complete within 500ms.
- **PR-NAV-03**: Tab switches shall be instant (< 100ms).
- **PR-NAV-04**: Navigation state shall persist across app restarts.

## Related Specifications
- Community Moderation: See `docs/specs/moderation/community-moderation.md`
- Guest Mode: See `docs/specs/architecture/guest-mode.md`
- Deep Linking: See `docs/specs/architecture/deep-linking.md` (if exists)
- Authentication: See `docs/specs/user-management/authentication.md`
