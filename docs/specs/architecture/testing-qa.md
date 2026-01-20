# Testing & Quality Assurance Specification

## Purpose
Defines the testing strategy and quality benchmarks to ensure application stability, performance, and security.

## Functional Requirements
- **FR-TEST-01**: The system shall have automated unit tests for all domain repositories.
- **FR-TEST-02**: The system shall verify offline synchronization logic via simulated network failures.
- **FR-TEST-03**: The system shall verify UI transitions and state changes (e.g., Guest to Authenticated).
- **FR-TEST-04**: The system shall verify data consistency across background/foreground transitions.

## Testing Strategy

### 1. Unit Testing (Jest)
- **Repositories**: Verified using mocked database clients to ensure correct query formation and data mapping.
- **Dependency Injection**: The `RepositoryProvider` supports an `overrides` prop, allowing specific repositories to be replaced with mock implementations during testing or for specific screen previews.
- **Logic**: Pure functions like `isUserOnline` and `isMockMode` are tested for all edge cases.
- **Stores**: Zustand stores are tested for state updates and persistence.

### 2. Component Testing (React Native Testing Library)
- **Render Tests**: Ensure components display correctly with different props.
- **Interaction Tests**: Simulate user clicks and inputs to verify handler calls and navigation.
- **Skeleton/Loading**: Verify that loading states are shown and hidden correctly.

### 3. Integration & E2E Testing
- **Tool**: Maestro.
- **Guest Mode Transitions**: Verifying that signing in from a guest gate preserves the intended destination (where applicable).
- **Sync Manager**: Verifying that the queue is processed only when online and in the correct order.
- **CI Integration**: Maestro flows are automatically executed on every Pull Request via the `maestro-e2e.yml` workflow to prevent regressions.

## Key Test Scenarios (Examples)
...

## Invariants and Guarantees
- **100% Repository Coverage**: All methods in `src/domain/repositories` must have corresponding test cases in `src/data/repositories`.
- **Mock Integrity**: Mock implementations must behave identically to Supabase implementations regarding interface adherence.

## Terminology
- **Mock**: A fake implementation of a service.
- **Snapshot**: A saved version of a component's render output.
- **Shallow Render**: Rendering a component without its children.
