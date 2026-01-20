# Performance Specification

## Purpose
Defines the strategies and benchmarks used to ensure a smooth and responsive user experience, particularly in data-heavy screens like feeds and moderation dashboards.

## Functional Requirements
- **FR-PERF-01**: The system shall use pagination for all long lists (posts, communities) to minimize initial load time and memory usage.
- **FR-PERF-02**: The system shall implement image optimization (resize/compress) to reduce network bandwidth.
- **FR-PERF-03**: The system shall utilize local caching to provide instant data availability for recently visited screens.

## Performance Strategies

### 1. UI Rendering Optimization
- **Memoization**: Heavy components (e.g., `PostCard`, `ReportCard`, `RadioOption`) must use `React.memo` to prevent re-renders when their parent state changes but their own props remain the same.
- **Stable Callbacks**: Handlers passed to list items (e.g., `onToggleLike`) must be wrapped in `useCallback` with stable dependencies to maintain consistent function references.
- **FlatList Optimization**:
    - `windowSize`: Optimized to balance between memory and scroll smoothness.
    - `initialNumToRender`: Set to fill the initial viewport (usually 5-10 items).

### 2. Data Loading Optimization
- **Parallel Fetching**: Independent data requests (e.g., badge counts for different statuses) must be executed using `Promise.all` rather than sequentially.
- **Minimum Skeleton Duration**: Curated discovery screens (e.g., Explore) shall enforce a 350ms minimum duration for skeletons to prevent visual "jitter" when the network is extremely fast.

### 3. State Management
- **Shallow Selectors**: Store observers shall use `useShallow` or specific selectors to ensure components only re-render when the specific data they consume changes.

## Test Cases
- **TC-PERF-01**: Verify that scrolling a list of 100+ posts maintains a consistent frame rate (target: 60fps).
- **TC-PERF-02**: Verify that navigating between tabs does not trigger re-fetches for cached data that has not yet expired.

## Terminology
- **FPS**: Frames Per Second.
- **Re-render**: The process of React updating the DOM/Native UI in response to state changes.
- **Jitter**: Rapid, unintended visual changes or flickering in the UI.
