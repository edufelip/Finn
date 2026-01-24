# Theming Specification

## Purpose
Defines the visual design system of the application, including color tokens, spacing, border radii, and theme switching functionality. The theme system follows Material Design 3 color roles for consistent, accessible UI.

## Functional Requirements

### Theme Preferences
- **FR-THME-01**: The system shall support Light and Dark color themes.
- **FR-THME-02**: The system shall allow users to choose between System, Light, and Dark preferences.
- **FR-THME-03**: The system shall persist the theme preference across app restarts (AsyncStorage).
- **FR-THME-04**: The system shall automatically follow OS theme changes when preference is "System".

### Color System
- **FR-THME-05**: The system shall implement Material Design 3 color roles (32 tokens).
- **FR-THME-06**: All UI components shall use semantic color tokens (not hardcoded hex values).
- **FR-THME-07**: The system shall provide brand-specific palette colors (Google, Apple).

### Layout System
- **FR-THME-08**: The system shall provide standardized spacing scale (xs to xxl).
- **FR-THME-09**: The system shall provide standardized border radius scale (xs to pill).
- **FR-THME-10**: The system shall provide placeholder gradients for user/community avatars.

### Status Bar
- **FR-THME-11**: The status bar color shall automatically adapt to current theme.
- **FR-THME-12**: The status bar text style shall adapt for contrast (light text on dark, dark text on light).

## Architecture

### Color Roles (Material Design 3)
**Location**: `src/presentation/theme/colors.ts`

**Type Definition**:
```typescript
export type ColorRoles = {
  // Primary colors
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  
  // Secondary colors
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  
  // Tertiary colors
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  
  // Background & Surface
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  
  // Inverse colors
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  
  // Error states
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  
  // Borders & Overlays
  outline: string;
  outlineVariant: string;
  surfaceTint: string;
  scrim: string;
  shadow: string;
  onScrim: string;
};
```

**Total Tokens**: 32 color roles per theme (light + dark)

### Light Theme Colors
```typescript
export const lightColors: ColorRoles = {
  primary: '#44A2D6',           // Brand blue
  onPrimary: '#FFFFFF',
  primaryContainer: '#D6F1FF',
  onPrimaryContainer: '#00324B',
  
  secondary: '#0F766E',         // Teal accent
  onSecondary: '#FFFFFF',
  secondaryContainer: '#CCFBF1',
  onSecondaryContainer: '#134E4A',
  
  tertiary: '#7C3AED',          // Purple accent
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#EDE9FE',
  onTertiaryContainer: '#4C1D95',
  
  background: '#F9FAFB',        // Light gray background
  onBackground: '#111827',
  surface: '#FFFFFF',
  onSurface: '#111827',
  surfaceVariant: '#F3F4F6',
  onSurfaceVariant: '#6B7280',
  
  error: '#EF4444',             // Red for errors
  // ... (see colors.ts for complete definition)
};
```

### Dark Theme Colors
```typescript
export const darkColors: ColorRoles = {
  primary: '#44A2D6',           // Same brand blue
  onPrimary: '#FFFFFF',
  primaryContainer: '#0B2B3B',  // Darker container
  onPrimaryContainer: '#BDEBFF',
  
  background: '#0F172A',        // Dark slate background
  surface: '#1E293B',           // Slightly lighter surface
  // ... (see colors.ts for complete definition)
};
```

### Brand Palette
**Location**: `src/presentation/theme/palette.ts`

```typescript
export const palette = {
  googleRed: '#EA4335',
  googleBlue: '#4285F4',
  googleYellow: '#FBBC05',
  googleGreen: '#34A853',
  appleBlack: '#111111',
  transparent: 'transparent',
  white: '#FFFFFF',
};
```

**Usage**: Social login buttons, brand-specific components

### Spacing Scale
**Location**: `src/presentation/theme/metrics.ts`

```typescript
export const spacing = {
  xs: 4,    // Extra small spacing
  sm: 8,    // Small spacing
  md: 12,   // Medium spacing
  lg: 16,   // Large spacing
  xl: 24,   // Extra large spacing
  xxl: 32,  // Extra extra large spacing
};
```

**Usage Example**:
```typescript
<View style={{ padding: spacing.md, marginBottom: spacing.lg }} />
```

### Border Radius Scale
**Location**: `src/presentation/theme/metrics.ts`

```typescript
export const radii = {
  xs: 8,    // Subtle rounding
  sm: 10,   // Small buttons
  md: 16,   // Cards, inputs
  lg: 20,   // Large cards
  pill: 50, // Fully rounded (badges, avatars)
};
```

**Usage Example**:
```typescript
<View style={{ borderRadius: radii.md }} />
```

### Placeholder Gradients
**Location**: `src/presentation/theme/gradients.ts`

```typescript
export const PLACEHOLDER_GRADIENTS = [
  ['#FF6B6B', '#FFD93D'],  // Red to yellow
  ['#6BCB77', '#4D96FF'],  // Green to blue
  ['#9D50BB', '#6E48AA'],  // Purple
  ['#F2994A', '#F2C94C'],  // Orange to yellow
  ['#2193b0', '#6dd5ed'],  // Blue
  ['#EE0979', '#FF6A00'],  // Pink to orange
  ['#00B4DB', '#0083B0'],  // Cyan
  ['#7028E4', '#E5E0FF'],  // Purple to lavender
] as const;

export const getPlaceholderGradient = (id: number): [string, string, ...string[]] => {
  const index = Math.abs(id) % PLACEHOLDER_GRADIENTS.length;
  return [...(PLACEHOLDER_GRADIENTS[index] || PLACEHOLDER_GRADIENTS[0])];
};
```

**Usage**: Generate consistent gradient backgrounds for users/communities based on their ID.

## Theme Provider

### Implementation
**Location**: `src/app/providers/ThemeProvider.tsx`

```typescript
export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  isDark: boolean;
  colors: ThemeColors;
  setPreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
};
```

**Features**:
- Persists preference to AsyncStorage (key: `theme_preference`)
- Listens to OS theme changes via `useColorScheme()`
- Resolves final theme: `system` → uses OS preference, `light`/`dark` → explicit
- Provides theme context to entire app via React Context

### Hooks

**useTheme()**
```typescript
const { preference, isDark, colors, setPreference, toggleTheme } = useTheme();
```
Returns full theme context including preference management.

**useThemeColors()**
```typescript
const colors = useThemeColors();
const backgroundColor = colors.background;
```
Returns only the color roles for the current theme (performance optimized).

## Use Cases

### UC-THME-01: Switch to Dark Mode
1. User navigates to Settings screen.
2. User taps "Appearance" option.
3. System shows theme picker (System, Light, Dark).
4. User selects "Dark".
5. System calls `setPreference('dark')`.
6. System persists to AsyncStorage.
7. All UI components using `useThemeColors()` re-render with darkColors.
8. Status bar updates to light text style.

### UC-THME-02: Follow System Theme
1. User selects "System" preference in settings.
2. System calls `setPreference('system')`.
3. System reads OS theme via `useColorScheme()`.
4. If OS is dark mode, `isDark = true` and `colors = darkColors`.
5. User switches OS to light mode externally.
6. `useColorScheme()` hook detects change.
7. System updates `isDark = false` and `colors = lightColors`.
8. All UI components re-render with light theme.

### UC-THME-03: Quick Theme Toggle
1. User taps theme toggle button (if present).
2. System calls `toggleTheme()`.
3. If current resolved theme is dark, switch to light (and vice versa).
4. System updates preference to explicit `light` or `dark`.
5. System persists to AsyncStorage.
6. UI updates immediately.

### UC-THME-04: Use Semantic Colors in Component
1. Developer creates new Button component.
2. Component calls `const colors = useThemeColors()`.
3. Component applies `backgroundColor: colors.primary`.
4. Component applies `color: colors.onPrimary` for text.
5. Button automatically adapts to light/dark theme changes.
6. No hardcoded hex values → theme-aware by default.

### UC-THME-05: Generate Placeholder Gradient
1. System needs to display user avatar without photo.
2. System calls `getPlaceholderGradient(userId)`.
3. Function returns consistent gradient based on userId.
4. System renders LinearGradient with returned colors.
5. Same user always gets same gradient (deterministic).

### UC-THME-06: Apply Consistent Spacing
1. Developer creates new Card component.
2. Developer applies `padding: spacing.lg` (16px).
3. Developer applies `marginBottom: spacing.md` (12px).
4. Card follows design system spacing scale.
5. Spacing remains consistent across all screens.

## Test Cases

### Theme Switching
- **TC-THME-01**: Verify "System" preference follows OS theme changes.
- **TC-THME-02**: Verify "Light" preference uses lightColors regardless of OS.
- **TC-THME-03**: Verify "Dark" preference uses darkColors regardless of OS.
- **TC-THME-04**: Verify theme preference persists to AsyncStorage.
- **TC-THME-05**: Verify theme preference loads from AsyncStorage on app restart.
- **TC-THME-06**: Verify toggleTheme switches between light and dark.

### Status Bar
- **TC-THME-07**: Verify status bar text is light on dark theme.
- **TC-THME-08**: Verify status bar text is dark on light theme.
- **TC-THME-09**: Verify status bar color adapts to theme changes.

### Color System
- **TC-THME-10**: Verify lightColors has all 32 required color roles.
- **TC-THME-11**: Verify darkColors has all 32 required color roles.
- **TC-THME-12**: Verify useThemeColors returns correct colors for active theme.
- **TC-THME-13**: Verify components re-render when theme changes.
- **TC-THME-14**: Verify primary color is #44A2D6 in both themes.

### Metrics
- **TC-THME-15**: Verify spacing scale has 6 values (xs to xxl).
- **TC-THME-16**: Verify radii scale has 5 values (xs to pill).
- **TC-THME-17**: Verify spacing values match design system (4, 8, 12, 16, 24, 32).
- **TC-THME-18**: Verify radii values match design system (8, 10, 16, 20, 50).

### Gradients
- **TC-THME-19**: Verify getPlaceholderGradient returns consistent gradient for same ID.
- **TC-THME-20**: Verify gradient array has exactly 8 gradient pairs.
- **TC-THME-21**: Verify gradient selection wraps with modulo (handles any ID).
- **TC-THME-22**: Verify negative IDs work correctly (Math.abs used).

### Palette
- **TC-THME-23**: Verify palette contains Google brand colors.
- **TC-THME-24**: Verify palette contains Apple black.
- **TC-THME-25**: Verify palette colors match brand guidelines.

## Performance Requirements
- **PR-THME-01**: Theme switches shall complete within 16ms (single frame).
- **PR-THME-02**: AsyncStorage reads shall not block initial render.
- **PR-THME-03**: useThemeColors hook shall use memo to prevent unnecessary re-renders.
- **PR-THME-04**: Theme context updates shall batch re-renders efficiently.

## Design System Compliance

### Material Design 3
The color system follows MD3 principles:
- **Surface colors**: Background, surface, surfaceVariant for layering
- **On colors**: onSurface, onBackground for text/icons on colored surfaces
- **Container colors**: primaryContainer for filled button backgrounds
- **Inverse colors**: For reversed color schemes (dark text on light in dark theme)

### Color Usage Guidelines
- **Primary**: Main brand actions (buttons, FABs, selected states)
- **Secondary**: Secondary actions, complementary elements
- **Tertiary**: Accent colors, highlights
- **Error**: Error states, destructive actions
- **Surface**: Cards, sheets, dialogs
- **Background**: Screen backgrounds
- **Outline**: Borders, dividers, input outlines

### Accessibility
- All color pairs meet WCAG AA contrast ratios
- onPrimary on primary: 4.5:1 minimum
- onSurface on surface: 4.5:1 minimum
- onBackground on background: 4.5:1 minimum

## Related Specifications
- Components: See design system documentation (if exists)
- Settings: See `docs/specs/user-management/settings.md` (if exists)
- Accessibility: See accessibility guidelines (if exists)