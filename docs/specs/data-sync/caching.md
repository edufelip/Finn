# Caching Specification

## Purpose
Improves performance by storing remote data locally.

## Functional Requirements
- **FR-CASH-01**: The system shall store API responses in `AsyncStorage` with a configurable TTL.
- **FR-CASH-02**: The system shall return cached data even if expired if `allowExpired` is requested.
- **FR-CASH-03**: The system shall provide mechanisms to manually clear specific cache keys.

## Test Cases
- **TC-CASH-01**: Verify that data is not fetched from the network if a valid cache entry exists.
- **TC-CASH-02**: Verify that clearing a cache key (e.g., after a post) triggers a fresh fetch on next access.

## Cache Policies
The system uses pre-defined TTLs:
- **Default**: 5 minutes
- **Feed / Posts**: 2 minutes
- **Comments**: 2 minutes
- **Communities**: 10 minutes
- **Profiles**: 10 minutes
- **Saved Posts**: 2 minutes
- **Topics**: 30 minutes

## Operations

### setCache
- **Inputs**: `key: string`, `value: T`, `ttlMs: number`
- **Behavior**: Wraps the value in a `CacheEntry` and persists it to `AsyncStorage`.

### getCache
- **Inputs**: `key: string`, `options?: { allowExpired?: boolean }`
- **Output**: `T | null`
- **Behavior**:
    1. Retrieves the entry from `AsyncStorage`.
    2. If no entry exists, returns `null`.
    3. Checks if `Date.now() - updatedAt > ttlMs`.
    4. If expired and `allowExpired` is false, returns `null`.
    5. If expired and `allowExpired` is true, returns the cached value anyway.
    6. If not expired, returns the cached value.
- **Error Handling**: If parsing fails, the entry is removed from `AsyncStorage`.

### clearCache
- **Inputs**: `key: string`
- **Behavior**: Removes the entry from `AsyncStorage`.

## Invariants and Guarantees
- **Local Persistence**: Data is saved to `AsyncStorage`.
- **TTL Enforcement**: Expired data is normally treated as a cache miss unless `allowExpired` is true.
