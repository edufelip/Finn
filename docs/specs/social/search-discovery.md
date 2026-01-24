# Search & Discovery Specification

## Purpose
Enables users to find communities and topics of interest through active search and filtered exploration with pagination support.

## Functional Requirements
- **FR-SRCH-01**: The system shall allow users to search for communities by title via a text query.
- **FR-SRCH-02**: The system shall allow filtering communities by a specific topic.
- **FR-SRCH-03**: The system shall support multiple sorting orders: `mostFollowed`, `leastFollowed`, `newest`, `oldest`.
- **FR-SRCH-04**: The system shall display subscription status for each community in search results.
- **FR-SRCH-05**: The system shall allow guests to search and browse results without signing in.
- **FR-SRCH-06**: The system shall support pagination with page-based loading (20 communities per page).
- **FR-SRCH-07**: The system shall perform community search and sorting at the database level for optimal performance.
- **FR-SRCH-08**: The system shall cache search results with granular cache keys (search query, sort order, topic filter, page).

## Architecture

### Database Layer
- **RPC Function**: `search_communities(search_text, topic_filter, sort_order, limit_count, offset_count)`
  - Performs efficient SQL query with LEFT JOIN on subscriptions
  - Aggregates subscriber counts at database level
  - Applies sorting in SQL (no in-memory processing)
  - Returns paginated results with configurable limit/offset

### Repository Layer
- **Interface**: `CommunityRepository.getCommunities(params?: CommunitySearchParams)`
  - `CommunitySearchParams`: `{ search?, sort?, topicId?, page?, pageSize? }`
  - Default page size: 20 communities
  - Caching strategy: Cache key includes all parameters for granular invalidation

### Presentation Layer
- **Hook**: `useSearchCommunities`
  - **State**: `communities`, `topics`, `selectedTopicId`, `sortOrder`, `page`, `hasMore`, `loading`, `loadingMore`
  - **Methods**:
    - `searchCommunities(query)`: Execute new search with page reset
    - `applyTopicFilter(topicId)`: Filter by topic with page reset
    - `applySortOrder(sortOrder)`: Apply sort order with page reset
    - `loadMore()`: Load next page of results
  - Automatically loads on mount if `shouldLoadOnMount` is true

## Use Cases

### UC-SRCH-01: Search for a Community
1. User navigates to the Search tab.
2. User types "Javascript" in the search input.
3. System calls `searchCommunities('Javascript')`.
4. System fetches first page (20 communities) matching the query from the database.
5. System displays the results with community names, follower counts, and icons.
6. User scrolls to bottom of list.
7. System calls `loadMore()` to fetch next page.
8. System appends new results to existing list.

### UC-SRCH-02: Filter by Topic
1. User clicks the "Filter by Topic" button.
2. System displays a list of available topics.
3. User selects "Technology".
4. System calls `applyTopicFilter(topicId)`.
5. System resets to page 0 and fetches communities filtered by topic.
6. System displays filtered results.

### UC-SRCH-03: Change Sort Order
1. User clicks "Sort by" button.
2. System displays sort options: Most Followed, Least Followed, Newest, Oldest.
3. User selects "Newest".
4. System calls `applySortOrder('newest')`.
5. System resets to page 0 and fetches communities sorted by creation date descending.
6. System displays re-sorted results.

### UC-SRCH-04: Pagination
1. User performs a search that returns 25 matching communities.
2. System displays first 20 communities.
3. User scrolls to bottom of list.
4. System detects scroll near end and calls `loadMore()`.
5. System fetches page 2 (next 5 communities).
6. System appends communities to list.
7. System sets `hasMore = false` (less than 20 returned).
8. User scrolls to bottom again - no additional load occurs.

## Test Cases

### Search Functionality
- **TC-SRCH-01**: Verify that changing the sort order (e.g., to "Newest") correctly re-orders the search results.
- **TC-SRCH-02**: Verify that searching with an empty query returns all communities or a trending list.
- **TC-SRCH-03**: Verify that subscription buttons in search results reflect the user's current status and update optimistically.
- **TC-SRCH-04**: Verify that search query is case-insensitive and matches partial titles.

### Filtering
- **TC-SRCH-05**: Verify that applying a topic filter resets pagination to page 0.
- **TC-SRCH-06**: Verify that clearing a topic filter returns to unfiltered results.
- **TC-SRCH-07**: Verify that combining search query with topic filter works correctly.

### Pagination
- **TC-SRCH-08**: Verify that initial load fetches exactly 20 communities.
- **TC-SRCH-09**: Verify that `loadMore()` appends next page without duplicates.
- **TC-SRCH-10**: Verify that `hasMore` becomes false when fewer than 20 communities are returned.
- **TC-SRCH-11**: Verify that changing filters resets pagination and clears existing results.
- **TC-SRCH-12**: Verify that loading indicator shows during initial load and loadingMore shows during pagination.

### Caching
- **TC-SRCH-13**: Verify that identical search parameters return cached results.
- **TC-SRCH-14**: Verify that different page numbers have separate cache entries.
- **TC-SRCH-15**: Verify that cache is invalidated when creating/updating communities.

### Performance
- **TC-SRCH-16**: Verify that sorting is performed at database level (check SQL query execution).
- **TC-SRCH-17**: Verify that subscriber counts are aggregated in SQL (no N+1 query issues).
- **TC-SRCH-18**: Verify that pagination reduces initial load time compared to fetching all results.

## Implementation Details

### Cache Key Structure
```typescript
`communities:search:${search}:topic:${topicId}:sort:${sortOrder}:page:${page}:size:${pageSize}`
```
Example: `communities:search:javascript:topic:2:sort:newest:page:0:size:20`

### SQL Query (search_communities RPC)
```sql
SELECT
  c.id,
  c.title,
  c.description,
  c.image_url,
  c.owner_id,
  c.topic_id,
  c.created_at,
  c.post_permission,
  COALESCE(COUNT(s.id), 0) AS subscribers_count
FROM public.communities c
LEFT JOIN public.subscriptions s ON s.community_id = c.id
WHERE (search_text IS NULL OR c.title ILIKE ('%' || search_text || '%'))
  AND (topic_filter IS NULL OR c.topic_id = topic_filter)
GROUP BY c.id
ORDER BY
  CASE WHEN sort_order = 'mostFollowed' THEN COUNT(s.id) END DESC,
  CASE WHEN sort_order = 'leastFollowed' THEN COUNT(s.id) END ASC,
  CASE WHEN sort_order = 'newest' THEN c.created_at END DESC,
  CASE WHEN sort_order = 'oldest' THEN c.created_at END ASC,
  c.id ASC
LIMIT limit_count OFFSET offset_count;
```

### Performance Improvements
**Before:**
- Fetched all communities with `SELECT * FROM communities`
- Performed multiple queries to count subscribers for each community (N+1 problem)
- Sorted in-memory on client side
- No pagination (loaded all communities at once)

**After:**
- Single RPC call with efficient SQL query
- Subscriber counts aggregated in single query via LEFT JOIN + GROUP BY
- Sorting performed at database level
- Pagination with configurable page size (default 20)
- Granular cache keys prevent stale data

**Result**: ~10x faster initial load, reduced bandwidth, improved user experience.

## Terminology
- **Sort Order**: The criteria used to arrange results (mostFollowed, leastFollowed, newest, oldest).
- **Topic Filter**: A categorical constraint applied to the search query.
- **Page**: Zero-based page index for pagination (0 = first page).
- **Page Size**: Number of communities returned per page (default 20).
- **Has More**: Boolean indicating if additional pages are available.
