# Search & Discovery Specification

## Purpose
Enables users to find communities and topics of interest through active search and filtered exploration.

## Functional Requirements
- **FR-SRCH-01**: The system shall allow users to search for communities by title via a text query.
- **FR-SRCH-02**: The system shall allow filtering communities by a specific topic.
- **FR-SRCH-03**: The system shall support multiple sorting orders: `mostFollowed`, `leastFollowed`, `newest`, `oldest`.
- **FR-SRCH-04**: The system shall display subscription status for each community in search results.
- **FR-SRCH-05**: The system shall allow guests to search and browse results without signing in.

## Use Cases
### UC-SRCH-01: Search for a Community
1. User navigates to the Search tab.
2. User types "Javascript" in the search input.
3. System fetches communities matching the query from the repository.
4. System displays the results with community names, follower counts, and icons.

### UC-SRCH-02: Filter by Topic
1. User clicks the "Filter by Topic" button.
2. System displays a list of available topics.
3. User selects "Technology".
4. System refreshes the results to show only communities under the "Technology" topic.

## Test Cases
- **TC-SRCH-01**: Verify that changing the sort order (e.g., to "Newest") correctly re-orders the search results.
- **TC-SRCH-02**: Verify that searching with an empty query (or clearing the search) returns all communities or a trending list.
- **TC-SRCH-03**: Verify that subscription buttons in search results reflect the user's current status and update optimistically.

## Terminology
- **Sort Order**: The criteria used to arrange results.
- **Topic Filter**: A categorical constraint applied to the search query.
