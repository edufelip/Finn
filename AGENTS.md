# Repository Guidelines

## Contributor Expectations
- Deliver production-quality changes and document key decisions.
- Add or update tests when behavior changes; note manual validation when needed.
- Keep changes scoped and prefer small, reviewable diffs.

## Project Structure & Module Organization
- `src/app`: app bootstrap, stores, and providers.
- `src/domain`: core models and repository interfaces.
- `src/data`: Supabase repositories, caching, offline queue, and data sync.
- `src/presentation`: navigation and screens.
- `__tests__`: unit/integration tests.
- `e2e/maestro`: end-to-end tests.
- `assets`: static images, icons, and media.
- `docs`: specs and testing guidance.
- `supabase`: migrations and SQL helpers.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run start`: start Metro bundler.
- `npm run ios` / `npm run android`: run native builds on device.
- `npm run lint`: lint with Expo ESLint config.
- `npm run typecheck`: TypeScript type check.
- `npm test`: run Jest tests (CI-friendly, no watch).
- `npm run e2e`: run Maestro tests (pair with `EXPO_PUBLIC_APP_MODE=mock`).

## Coding Style & Naming Conventions
- TypeScript + React Native (Expo). Use 2-space indentation and semicolons.
- Components/screens in PascalCase; hooks `useX`; `testID`s are kebab-case.
- Keep domain interfaces in `src/domain`, concrete implementations in `src/data`, UI in `src/presentation`.

## Testing Guidelines
- Frameworks: Jest, `jest-expo`, `@testing-library/react-native`.
- Place tests under `__tests__` and name files `*.test.ts(x)`.
- E2E flows live in `e2e/maestro`; use mock mode for deterministic data.
- Manual scenarios are documented in `docs/TESTING_GUIDE.md`.

## Commit & Pull Request Guidelines
- Prefixes: `feat`, `feature`, `featuer` (legacy), `fix`, `refactor`, `docs`, `test`, `perf`, `ci`; optional scopes like `feat(ui): ...`.
- Keep subjects short and imperative.
- PRs include summary, testing notes (commands + results), and screenshots for UI changes.

## Configuration & Environment Tips
- Copy `.env.example` to `.env` and set Expo public variables.
- Supabase scripts live in `scripts/`; avoid seeding prod unless explicitly intended.

## Native Projects
Expo prebuild has been run; `ios/` and `android/` are managed directly. Avoid re-running prebuild unless explicitly planned.
