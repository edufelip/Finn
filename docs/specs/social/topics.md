# Topics Specification

## Purpose
Topics provide a high-level categorization for communities, allowing users to browse by interest.

## Functional Requirements
- **FR-TOP-01**: The system shall provide a list of all available topics.
- **FR-TOP-02**: The system shall provide a list of "popular" topics based on community counts.
- **FR-TOP-03**: The system shall allow fetching a single topic by its ID.

## Use Cases
### UC-TOP-01: Browse Popular Topics
1. User navigates to the Explore screen.
2. System fetches popular topics via a database RPC.
3. System displays the topics with their respective icons and colors.
4. User clicks a topic to filter communities.

## Test Cases
- **TC-TOP-01**: Verify that if the popular topics RPC fails, the system falls back to an alphabetical list.
- **TC-TOP-02**: Verify that topics are cached locally for 1 week to reduce network overhead.

## Topic Tones & Visuals
The system uses a semantic tone mapping to ensure visual variety and accessibility:
- **orange**: Uses `error` palette tones.
- **green**: Uses `secondary` palette tones.
- **purple**: Uses `tertiary` palette tones.
- **blue**: Uses `primary` palette tones.

## Invariants and Guarantees
- **Visual Consistency**: Each topic has a pre-defined `tone` and `icon`.
- **Performance**: Topics are cached extensively as they rarely change.
- **Popularity Logic**: Popularity is defined by the number of communities associated with a topic, calculated server-side via `get_popular_topics` RPC.