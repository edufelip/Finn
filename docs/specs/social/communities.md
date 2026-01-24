# Communities Specification

## Purpose
Communities are the primary containers for posts, grouped by interest. Each community has an owner, moderation settings, and can be discovered through search and topic filtering.

## Functional Requirements

### Core Features
- **FR-COMM-01**: Users shall be able to create new communities.
    - **Validation**: Title is required (max 100 characters).
    - **Validation**: Description is required (max 500 characters).
    - **Validation**: Community image is required.
    - **Validation**: Topic selection is required.
- **FR-COMM-02**: Community owners shall be able to set posting permissions:
    - `anyone_follows`: Any follower can post immediately.
    - `moderated`: Posts require owner approval before appearing.
    - `private`: Only owner can post.
- **FR-COMM-03**: Users shall be able to search for communities by title or topic.
- **FR-COMM-04**: Users shall be able to subscribe/unsubscribe to communities.
- **FR-COMM-05**: The system shall serve community images via signed URLs from Supabase storage.
- **FR-COMM-06**: Community owners shall be able to edit community settings (description, image, permissions).
- **FR-COMM-07**: Community owners shall be able to delete their communities.

### Search and Discovery
- **FR-COMM-08**: Search results shall support pagination (20 communities per page).
- **FR-COMM-09**: Communities shall support 4 sort orders:
    - `mostFollowed`: Sort by subscriber count (descending).
    - `leastFollowed`: Sort by subscriber count (ascending).
    - `newest`: Sort by creation date (descending).
    - `oldest`: Sort by creation date (ascending).
- **FR-COMM-10**: Users shall be able to filter communities by topic.
- **FR-COMM-11**: Search shall be case-insensitive and match partial titles.

### Reporting and Moderation
- **FR-COMM-12**: Users shall be able to report communities that violate guidelines.
- **FR-COMM-13**: Report reasons shall be required (15-300 characters).
- **FR-COMM-14**: Users shall not be able to submit duplicate reports for the same community.
- **FR-COMM-15**: Community owners shall have access to moderation tools.

## Architecture

### Domain Models
**Location**: `src/domain/models/community.ts`

```typescript
export type PostPermission = 'anyone_follows' | 'moderated' | 'private';

export interface Community {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  ownerId: string;
  topicId: number;
  createdAt: Date;
  postPermission: PostPermission;
  subscribersCount?: number;
}
```

### Repository Interface
**Location**: `src/domain/repositories/CommunityRepository.ts`

```typescript
export type CommunitySortOrder = 'mostFollowed' | 'leastFollowed' | 'newest' | 'oldest';

export interface CommunityRepository {
  getCommunities(params?: CommunitySearchParams): Promise<Community[]>;
  getCommunity(id: number): Promise<Community | null>;
  getCommunitiesFromUser(userId: string): Promise<Community[]>;
  getSubscribedCommunities(userId: string): Promise<Community[]>;
  getCommunitySubscribersCount(communityId: number): Promise<number>;
  saveCommunity(community: Community, imageUri?: string | null): Promise<Community>;
  updateCommunitySettings(communityId: number, settings: {
    postPermission?: PostPermission;
    imageUrl?: string | null;
  }, imageUri?: string | null): Promise<Community>;
  subscribe(subscription: Subscription): Promise<Subscription>;
  unsubscribe(subscription: Subscription): Promise<void>;
  getSubscription(userId: string, communityId: number): Promise<Subscription | null>;
  deleteCommunity(communityId: number): Promise<void>;
}
```

### Database Schema
**Location**: `supabase/migrations/20231201_communities.sql`

**Table**: `communities`
- `id` (bigserial, primary key)
- `title` (text, not null)
- `description` (text, not null)
- `image_url` (text, not null)
- `owner_id` (uuid, references profiles.id)
- `topic_id` (bigint, references topics.id)
- `created_at` (timestamptz, default now())
- `post_permission` (text, default 'anyone_follows')

**Table**: `subscriptions`
- `id` (bigserial, primary key)
- `user_id` (uuid, references profiles.id)
- `community_id` (bigint, references communities.id)

**Table**: `community_reports` (added in `20260124123000_create_community_reports.sql`)
- `id` (bigserial, primary key)
- `community_id` (bigint, references communities.id, cascade delete)
- `user_id` (uuid, references profiles.id, cascade delete)
- `reason` (text, 15-300 chars)
- `created_at` (timestamptz, default now())
- **Constraint**: Unique index on (user_id, community_id) prevents duplicate reports

### RPC Functions
**Location**: `supabase/migrations/20260124120000_search_communities.sql`

**Function**: `search_communities(search_text, topic_filter, sort_order, limit_count, offset_count)`
- Performs case-insensitive title search
- Filters by topic if specified
- Joins with subscriptions to calculate subscriber count
- Supports 4 sort orders
- Returns paginated results (default: 20 per page)

## Implementation Details

### Search Hook
**Location**: `src/presentation/hooks/useSearchCommunities.ts`

**Key Features**:
- Pagination with 20 items per page
- Optimistic subscription updates
- Offline queue support for subscribe/unsubscribe
- Guest mode detection
- Network state monitoring
- Confirmation alert for unsubscribe action

**State Management**:
```typescript
const {
  communities,           // Current search results
  topics,                // Available topics for filtering
  selectedTopicId,       // Active topic filter
  sortOrder,             // Active sort order
  loading,               // Initial load state
  loadingMore,          // Pagination load state
  hasMore,              // More pages available
  activeQuery,          // Current search query
  userSubscriptions,    // User's subscription state
  searchCommunities,    // Search by query
  applyTopicFilter,     // Filter by topic
  applySortOrder,       // Change sort order
  loadMore,             // Load next page
  handleToggleSubscription  // Subscribe/unsubscribe
} = useSearchCommunities({ initialSort, initialTopicId, shouldLoadOnMount });
```

### Storage
Community images are stored in Supabase storage bucket `community-images` with signed URLs (7-day expiry).

## Use Cases

### UC-COMM-01: Create a Community
1. User navigates to Create Community screen.
2. User enters title, description, selects topic.
3. User uploads community image.
4. User selects post permission level.
5. System validates input and creates community.
6. User is automatically subscribed as owner.

### UC-COMM-02: Search and Join a Community
1. User searches for "React Native".
2. System queries communities with partial title match.
3. User applies "Most Followed" sort order.
4. User taps on a community from results.
5. User views community details.
6. User taps "Subscribe".
7. System creates subscription and updates subscriber count.
8. Confirmation alert shows success (or queues offline).

### UC-COMM-03: Filter Communities by Topic
1. User opens Search screen.
2. User selects "Technology" topic filter.
3. System loads communities with topic_id matching "Technology".
4. User sees paginated results sorted by mostFollowed.

### UC-COMM-04: Report a Community
1. User navigates to community detail.
2. User taps "Report Community" option.
3. User enters reason (15-300 characters).
4. System validates and creates community_report record.
5. System prevents duplicate reports from same user.

### UC-COMM-05: Edit Community Settings
1. Community owner navigates to Edit Community screen.
2. Owner updates description and/or image.
3. Owner changes post permission to "moderated".
4. System updates community record.
5. New settings apply to all users immediately.

### UC-COMM-06: Load More Communities (Pagination)
1. User scrolls to bottom of community list.
2. System detects end of list and calls loadMore().
3. System fetches next page (page + 1, offset += 20).
4. System appends results to existing list.
5. System updates hasMore flag based on result count.

## Test Cases

### Search and Pagination
- **TC-COMM-01**: Verify "Most Followed" sort returns communities ordered by subscribers_count DESC.
- **TC-COMM-02**: Verify "Newest" sort returns communities ordered by created_at DESC.
- **TC-COMM-03**: Verify search query "react" matches "React Native" and "React Hooks" (case-insensitive).
- **TC-COMM-04**: Verify pagination loads exactly 20 communities per page.
- **TC-COMM-05**: Verify hasMore is false when result count < 20.
- **TC-COMM-06**: Verify topic filter returns only communities with matching topic_id.

### Subscriptions
- **TC-COMM-07**: Verify subscribe creates subscription record and increments subscriber count.
- **TC-COMM-08**: Verify unsubscribe shows confirmation alert before deletion.
- **TC-COMM-09**: Verify unsubscribe removes subscription and decrements count.
- **TC-COMM-10**: Verify offline subscribe queues operation and shows offline alert.
- **TC-COMM-11**: Verify subscription state persists in communityStore.

### Reporting
- **TC-COMM-12**: Verify report creation with valid reason (15-300 chars) succeeds.
- **TC-COMM-13**: Verify duplicate report from same user fails with unique constraint error.
- **TC-COMM-14**: Verify report reason validation rejects <15 or >300 characters.
- **TC-COMM-15**: Verify community owner cannot report their own community (if enforced).

### Permissions
- **TC-COMM-16**: Verify only owner can edit community settings.
- **TC-COMM-17**: Verify only owner can delete community.
- **TC-COMM-18**: Verify "private" permission only allows owner to create posts.
- **TC-COMM-19**: Verify "moderated" permission requires owner approval for posts.
- **TC-COMM-20**: Verify "anyone_follows" permission allows all subscribers to post immediately.

### Edge Cases
- **TC-COMM-21**: Verify guest users cannot subscribe (shows guest gate).
- **TC-COMM-22**: Verify image upload handles network errors gracefully.
- **TC-COMM-23**: Verify optimistic update reverts on API failure.
- **TC-COMM-24**: Verify empty search returns all communities (sorted by mostFollowed).

## Performance Requirements
- **PR-COMM-01**: Search queries shall complete within 500ms under normal conditions.
- **PR-COMM-02**: Community images shall use signed URLs with 7-day expiry and CDN caching.
- **PR-COMM-03**: Pagination shall prevent loading duplicate pages simultaneously.

## Related Specifications
- Subscriptions: See `docs/specs/social/social-graph.md`
- Topics: See `docs/specs/social/topics.md`
- Community Moderation: See `docs/specs/moderation/community-moderation.md`
- Community Reports: See `docs/specs/moderation/post-reporting.md` (similar pattern)
- Search Discovery: See `docs/specs/social/search-discovery.md`