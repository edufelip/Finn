# Explore & Trending Specification

## Purpose
Provides a curated discovery experience by highlighting popular communities and suggesting relevant content.

## Functional Requirements
- **FR-EXPL-01**: The system shall display a list of "Trending" communities based on subscriber counts.
- **FR-EXPL-02**: The system shall display a "Your Feed" section suggesting additional communities not in the trending list.
- **FR-EXPL-03**: The system shall display popular topics for quick filtering.
- **FR-EXPL-04**: The system shall enforce a minimum loading state duration to prevent UI flickering.

## Content Selection Logic (useExploreData)
1. **Fetch**: System retrieves all communities and popular topics in parallel.
2. **Sort**: Communities are sorted in descending order by `subscribersCount`.
3. **Split**:
    - **Trending**: The top `exploreCopy.trendingLimit` (e.g., 5) communities.
    - **Feed**: The next `exploreCopy.feedLimit` (e.g., 10) communities.
4. **Race Condition Protection**: Uses a `loadToken` to ensure only the result of the most recent fetch is applied to the state.

## Performance Requirements
- **PR-EXPL-01**: Minimum Skeleton Duration: The `Shimmer` skeletons shall remain visible for at least **350ms** even if data returns faster, ensuring a stable visual transition.

## Use Cases
### UC-EXPL-01: Explore New Content
1. User navigates to the Explore tab.
2. System displays skeletons for Trending, Feed, and Topics.
3. After data loads (and min duration passes), content fades in.
4. User swipes horizontally through Trending communities.

## Test Cases
- **TC-EXPL-01**: Verify that the same community does not appear in both "Trending" and "Your Feed" sections.
- **TC-EXPL-02**: Verify that the "Reload" function correctly refreshes all sections of the explore screen.

## Terminology
- **Trending**: Communities with the highest global popularity.
- **Content Splitting**: Dividing a single API result into multiple semantic UI sections.
