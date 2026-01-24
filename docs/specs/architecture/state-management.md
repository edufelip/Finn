# Architecture & State Management Specification

## Overview
The "finn" application follows a Clean Architecture approach with a unidirectional data flow. State management is handled through Zustand stores for global application state, with repositories serving as the single source of truth for data fetching.

## Functional Requirements
- **FR-ARCH-01**: The system shall separate business logic (Domain) from data access (Data) and UI (Presentation).
- **FR-ARCH-02**: The system shall use global stores (Zustand) to manage shared application state.
- **FR-ARCH-03**: The system shall use Repositories as the single source of truth for data fetching.
- **FR-ARCH-04**: The system shall persist critical state to AsyncStorage for offline access.
- **FR-ARCH-05**: The system shall use selector hooks with shallow equality for performance optimization.

## Architecture Overview

### Layers
1. **Domain Layer** (`src/domain/`): Models and repository interfaces
2. **Data Layer** (`src/data/`): Repository implementations, caching, offline queue
3. **Presentation Layer** (`src/presentation/`): Screens, components, hooks
4. **App Layer** (`src/app/`): Stores, providers, configuration

### State Management Strategy
- **Global State**: Zustand stores for cross-screen state
- **Local State**: React useState/useReducer for component-specific state
- **Server State**: Repository pattern with caching layer
- **Persistence**: AsyncStorage via Zustand persist middleware

## Zustand Stores

### 1. App Store
**Location**: `src/app/store/appStore.ts`

**Purpose**: Manages application-level state (onboarding, app lifecycle)

**State Shape**:
```typescript
interface AppState {
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}
```

**Features**:
- ✅ Persisted to AsyncStorage (`app-storage` key)
- ✅ Tracks onboarding completion status
- Used by: Onboarding flow, navigation guards

**Usage**:
```typescript
const { hasSeenOnboarding, completeOnboarding } = useAppStore();
```

---

### 2. User Store
**Location**: `src/app/store/userStore.ts`

**Purpose**: Manages current authenticated user profile and loading state

**State Shape**:
```typescript
type UserState = {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};
```

**Features**:
- ❌ Not persisted (session-based)
- ✅ Supports partial updates (updateUser)
- ✅ Tracks loading and error states
- Used by: AuthProvider, ProfileScreen, SettingsScreen

**Usage**:
```typescript
const { currentUser, setUser, updateUser } = useUserStore();
```

---

### 3. Community Store
**Location**: `src/app/store/communityStore.ts`

**Purpose**: Manages user's community subscriptions for quick lookup

**State Shape**:
```typescript
type CommunityState = {
  subscriptions: Record<number, Subscription | null>; // communityId -> Subscription
  setSubscription: (communityId: number, subscription: Subscription | null) => void;
  setSubscriptions: (subscriptions: Record<number, Subscription | null>) => void;
  clearSubscriptions: () => void;
};
```

**Features**:
- ❌ Not persisted (refetched on app start)
- ✅ Record-based for O(1) lookup by communityId
- ✅ Supports batch updates (setSubscriptions)
- Used by: useSearchCommunities, CommunityDetail, subscription hooks

**Usage**:
```typescript
const { subscriptions, setSubscription } = useCommunityStore();
const isSubscribed = !!subscriptions[communityId];
```

---

### 4. Posts Store
**Location**: `src/app/store/postsStore.ts`

**Purpose**: Normalized post storage with multiple feed indexes for efficient rendering

**State Shape**:
```typescript
type PostsState = {
  postsById: Record<number, Post>;           // Normalized post storage
  homeIds: number[];                         // Home feed (Communities tab)
  followingIds: number[];                    // Following feed (People tab)
  communityIds: Record<number, number[]>;    // Per-community feeds
  profileIds: Record<string, number[]>;      // Per-user profile feeds
  savedIds: Record<string, number[]>;        // Per-user saved posts
  
  upsertPosts: (posts: Post[]) => void;
  setHomePosts: (posts: Post[], append?: boolean) => void;
  setFollowingPosts: (posts: Post[], append?: boolean) => void;
  setCommunityPosts: (communityId: number, posts: Post[], append?: boolean) => void;
  setProfilePosts: (userId: string, posts: Post[], append?: boolean) => void;
  setSavedPosts: (userId: string, posts: Post[], append?: boolean) => void;
  updatePost: (postId: number, patch: Partial<Post>) => void;
  setSavedForUser: (userId: string, postId: number, isSaved: boolean) => void;
  reset: () => void;
};
```

**Features**:
- ✅ Persisted to AsyncStorage (`posts-store` key)
- ✅ Normalized storage: Posts stored once in `postsById`, referenced by ID in feeds
- ✅ Prevents duplicate posts with `mergeIds` helper
- ✅ Supports pagination with `append` flag
- ✅ Optimistic updates via `updatePost`
- ✅ Negative count protection (likesCount, commentsCount never go below 0)
- ✅ Performance optimized with `useShallow` selector hooks

**Selector Hooks**:
```typescript
useHomePosts()                    // Returns Post[] for home feed
useFollowingPosts()               // Returns Post[] for following feed
useCommunityPosts(communityId)    // Returns Post[] for specific community
useProfilePosts(userId)           // Returns Post[] for specific user
useSavedPosts(userId)             // Returns Post[] for user's saved posts
usePostById(postId)               // Returns single Post
```

**Usage Example**:
```typescript
// In HomeScreen
const homePosts = useHomePosts();
const { setHomePosts } = usePostsStore();

// Load posts
const posts = await postRepository.getUserFeed(userId, page);
setHomePosts(posts, page > 0); // append if page > 0

// Optimistic like update
const { updatePost } = usePostsStore();
updatePost(postId, { isLiked: true, likesCount: (post.likesCount ?? 0) + 1 });
```

**Performance Optimization**:
- Uses `useShallow` from `zustand/react/shallow` to prevent unnecessary re-renders
- Only re-renders when the actual post data changes, not when other feeds update
- Normalized structure prevents duplicate post objects in memory

## Use Cases

### UC-ARCH-01: Update Global User State
1. AuthProvider detects a new session (user signs in).
2. AuthProvider fetches the user profile via UserRepository.
3. AuthProvider calls `setUser(profile)` on userStore.
4. All screens observing `useUserStore()` re-render with the new user data.
5. User profile displays name, photo, bio immediately.

### UC-ARCH-02: Subscribe to Community
1. User taps "Subscribe" button on Community Detail.
2. useSearchCommunities hook performs optimistic update:
   ```typescript
   setSubscription(communityId, { id: 0, userId, communityId });
   ```
3. Hook calls `communityRepository.subscribe()`.
4. On success, hook updates subscription with real ID:
   ```typescript
   setSubscription(communityId, createdSubscription);
   ```
5. On failure, hook reverts optimistic update:
   ```typescript
   setSubscription(communityId, previousSubscription);
   ```

### UC-ARCH-03: Load and Cache Posts
1. HomeScreen mounts and calls `useHomePosts()`.
2. Hook returns empty array (initial state).
3. Screen fetches posts via `postRepository.getUserFeed()`.
4. Screen calls `setHomePosts(posts)` to populate store.
5. Posts are persisted to AsyncStorage automatically.
6. On next app launch, `useHomePosts()` returns cached posts immediately.

### UC-ARCH-04: Optimistic Like Update
1. User taps like button on a post.
2. PostCard component calls:
   ```typescript
   updatePost(postId, { isLiked: true, likesCount: likesCount + 1 });
   ```
3. UI updates immediately (optimistic).
4. Component calls `postRepository.likePost()`.
5. On success, state remains updated.
6. On failure, component reverts:
   ```typescript
   updatePost(postId, { isLiked: false, likesCount: likesCount - 1 });
   ```

### UC-ARCH-05: Pagination with Posts Store
1. User scrolls to bottom of feed.
2. Screen calls `postRepository.getUserFeed(userId, page + 1)`.
3. Screen calls `setHomePosts(newPosts, true)` with `append=true`.
4. Store merges new post IDs into `homeIds` (deduplicates).
5. Store upserts new posts into `postsById`.
6. `useHomePosts()` hook returns updated array.
7. FlatList renders new posts at bottom.

### UC-ARCH-06: Clear State on Logout
1. User taps "Logout" in settings.
2. AuthProvider calls `clearUser()` on userStore.
3. AuthProvider calls `clearSubscriptions()` on communityStore.
4. AuthProvider calls `reset()` on postsStore.
5. All stores return to initial state.
6. Persisted stores clear AsyncStorage entries.
7. User is redirected to onboarding/login.

## Test Cases

### Store Functionality
- **TC-ARCH-01**: Verify appStore persists hasSeenOnboarding to AsyncStorage.
- **TC-ARCH-02**: Verify userStore updates currentUser with partial updates (updateUser).
- **TC-ARCH-03**: Verify communityStore supports batch subscription updates.
- **TC-ARCH-04**: Verify postsStore deduplicates posts when appending (mergeIds).
- **TC-ARCH-05**: Verify postsStore prevents negative counts (likesCount, commentsCount).

### Persistence
- **TC-ARCH-06**: Verify postsStore restores from AsyncStorage on app restart.
- **TC-ARCH-07**: Verify appStore restores hasSeenOnboarding on app restart.
- **TC-ARCH-08**: Verify postsStore reset clears AsyncStorage.

### Selectors
- **TC-ARCH-09**: Verify useHomePosts returns posts matching homeIds order.
- **TC-ARCH-10**: Verify useCommunityPosts(id) returns only posts for that community.
- **TC-ARCH-11**: Verify usePostById(id) returns correct post from postsById.
- **TC-ARCH-12**: Verify selector hooks use shallow equality (useShallow).

### Optimistic Updates
- **TC-ARCH-13**: Verify updatePost applies patch to existing post.
- **TC-ARCH-14**: Verify updatePost ignores patch if post doesn't exist.
- **TC-ARCH-15**: Verify setSubscription allows null (unsubscribe).

### Repository Integration
- **TC-ARCH-16**: Verify repository methods are injected via RepositoryProvider.
- **TC-ARCH-17**: Verify local store updates after successful remote writes.
- **TC-ARCH-18**: Verify optimistic updates revert on repository errors.

## Performance Requirements
- **PR-ARCH-01**: Store updates shall not block UI thread (Zustand uses immer internally).
- **PR-ARCH-02**: Selector hooks shall use shallow equality to minimize re-renders.
- **PR-ARCH-03**: Normalized post storage shall prevent memory duplication.
- **PR-ARCH-04**: AsyncStorage writes shall be asynchronous and non-blocking.

## Best Practices

### When to Use Stores
- ✅ Cross-screen state (user profile, subscriptions, posts)
- ✅ State that needs persistence (onboarding, cached feeds)
- ✅ Optimistic updates (likes, saves, subscriptions)
- ❌ Component-local state (form inputs, modal visibility)
- ❌ Derived state (use useMemo instead)

### Store Design Patterns
1. **Normalized Storage**: Store entities once, reference by ID
2. **Index Arrays**: Maintain separate arrays for different views (homeIds, followingIds)
3. **Optimistic Updates**: Update store immediately, revert on error
4. **Partial Updates**: Use patch objects instead of full replacements
5. **Selector Hooks**: Export custom hooks for common queries

### Performance Tips
- Use `useShallow` for array/object selectors to prevent unnecessary re-renders
- Use `partialize` in persist config to exclude non-serializable data
- Reset stores on logout to prevent memory leaks
- Batch multiple store updates when possible

## Related Specifications
- Repositories: See `docs/specs/architecture/repositories.md` (if exists)
- Caching: See `docs/specs/data-sync/caching.md`
- Offline Queue: See `docs/specs/data-sync/offline-queue.md`
- Authentication: See `docs/specs/user-management/authentication.md`