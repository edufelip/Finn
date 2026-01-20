# Application Lifecycle Specification

## Purpose
Defines how the application responds to state changes from the operating system (Foreground, Background, Inactive) to ensure efficient resource usage and data consistency.

## Functional Requirements
- **FR-LIFE-01**: The system shall monitor the application's active/inactive state via `AppState`.
- **FR-LIFE-02**: The system shall pause background resource-intensive tasks (e.g., presence heartbeats) when the app is backgrounded.
- **FR-LIFE-03**: The system shall resume session-dependent services when the app returns to the foreground.

## Lifecycle Behaviors

### 1. Presence & Realtime
- **Background Transition**: 
    - The system stops the Supabase Presence channel subscription.
    - The system clears the heartbeat interval (`setInterval`).
    - The system updates `last_seen_at` in the database one final time before the task is suspended.
- **Foreground Transition**: 
    - The system re-establishes the Presence channel.
    - The system restarts the heartbeat interval.

### 2. Synchronization
- **Foreground Transition**: 
    - The `SyncManager` is triggered to process any pending writes in the `offline_queue` if connectivity is available.

### 3. Data Freshness
- **Focus Effects**: Screens utilizing `useFocusEffect` (via React Navigation) re-fetch critical data or refresh timers when the user navigates back to them.

## Invariants and Guarantees
- **State Consistency**: UI components must correctly reflect the current system state, even after being suspended in the background for extended periods.

## Test Cases
- **TC-LIFE-01**: Verify that the presence heartbeat stops precisely when the `AppState` changes to `background`.
- **TC-LIFE-02**: Verify that the app re-syncs the offline queue immediately upon returning from the background.
