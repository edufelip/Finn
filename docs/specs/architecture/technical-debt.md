# Technical Debt & Refactoring Roadmap

## Purpose
Documents known architectural issues and performance bottlenecks to prioritize future engineering efforts.

## Identified Technical Debt

### 1. Monolithic Screens
- **Issue**: Screens like `EditCommunityScreen` and `ReportedContentScreen` exceed 500 lines and handle multiple responsibilities.
- **Goal**: Extract sub-components (e.g., `ReportCard`, `PostPermissionSelector`) into standalone files.

### 2. Redundant Authorization Logic
- **Issue**: Authentication and moderator checks are duplicated across multiple screens.
- **Goal**: Standardize on the `useModerationAuth` hook to centralize logic and alerts.

### 3. Missing Component Memoization
- **Issue**: Heavy components like `PostCard` re-render unnecessarily in long lists.
- **Goal**: Apply `React.memo` and stable `useCallback` references for list handlers.

### 4. Library Patches
- **Issue**: The project relies on manual patches for `expo-file-system` (IOS session dispatcher) and `expo-image-picker` (module config) to resolve upstream bugs or compatibility issues.
- **Goal**: Monitor official Expo releases and remove `patch-package` overrides once these fixes are integrated into main versions.

## Refactoring Goals (Priority: HIGH)
...

## Open Questions / Ambiguities
- **Global Error Boundaries**: Should we implement a global fallback for unhandled exceptions?
- **Optimistic Updates**: Should we implement optimistic UI for Likes and Comments to improve perceived performance?
