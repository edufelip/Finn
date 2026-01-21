# UI Guidelines & Common Components Specification

## Purpose
Ensures a cohesive visual identity and consistent user experience across the entire application.

## Functional Requirements
- **FR-UI-01**: Every main screen transition shall use the `ScreenFade` component.
- **FR-UI-02**: The system shall display `Shimmer` skeletons while content is loading.
- **FR-UI-03**: Interactive buttons and rows shall provide visual feedback when pressed.
- **FR-UI-04**: The system shall use the `TopBar` component for consistent headers.
- **FR-UI-05**: The system shall adapt its layout for tablet (iPad) devices.

## Core Components

### 1. ScreenFade
- **Behavior**: Animates the opacity of its children from 0 to 1 on mount.

### 2. Shimmer / Skeletons
- **Behavior**: Displays a pulsating animated background.

### 4. Professional Profile Pattern
- **Layout**: Features a 180px height cover image with a gradient transition to the background.
- **Avatar**: 100x100 rounded avatar (borderRadius: 30) overlapping the cover image by 50px.
- **Interactivity**: Horizontal sliding content pager using `react-native-reanimated` for smooth tab transitions.

### 5. Messaging & Chat UI
- **Structure**: Uses a `KeyboardAvoidingView` with a fixed-height header and flexible-height message list.
- **Bubbles**: Semantic differentiation between sender (Primary blue, sharp corner) and receiver (Surface white, sharp corner).
- **Attachments**: Standardized attachment cards with icons and metadata.
- **Input Constraints**: 
    - Text input limited to 100 characters with visible counter (format: "X/100").
    - Character counter displayed below input field, right-aligned, 10px font, grey color (#64748B).
- **Status Indicators**:
    - Online status: Green dot (#22C55E) on avatar + green text (#16A34A) "Online now".
    - Offline status: No dot on avatar + grey text (#64748B) "Offline".
    - Message states: "sending" (0.7 opacity), "sent" (default), "failed" (red bubble with retry).
- **Spacing**: Minimum 32px bottom padding above safe area for input container.
- **Header**: Back button + avatar + name/status (no additional action buttons).
- **Empty State**:
    - Icon: 96x96 circular container with light blue background (#EFF6FF) containing forum icon.
    - Title: "Start a conversation" (18px, semibold, #0F172A).
    - Body: Dynamic text mentioning peer's name (14px, #64748B).
    - Disclaimer: "Messages will disappear after 14 days" (12px, italic, #94A3B8).
    - Layout: Centered with 32px horizontal padding and 48px vertical padding.

## Accessibility & Platforms
- **Test IDs**: Interactive components use the `testID` prop.
- **Screen Readers**: Visual elements provide `accessibilityLabel`.
- **iPad Optimization**: 
    - Tab Bar labels are hidden on iPad to favor a cleaner, icon-only look.
    - Content is centered with appropriate max-widths on large screens.

## State Persistence
- **Global Stores**: `userStore`, `postsStore`, `appStore` use Zustand's `persist` middleware with `AsyncStorage`.

## Invariants and Guarantees
- **Layout Consistency**: Components use values from `metrics.ts`.
- **Color Sync**: All components consume colors from the `useThemeColors` hook.
- **FAB Logic**: The main action button (FAB) in the tab bar is visually elevated and transitions to a "lock" icon in Guest Mode.