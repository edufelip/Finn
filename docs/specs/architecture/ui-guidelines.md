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