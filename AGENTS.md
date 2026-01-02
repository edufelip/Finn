# Repository Guidelines

## Project Structure & Module Organization
- `mobile/`: React Native + Expo app (current rewrite). Source lives in `mobile/src` with `app/`, `domain/`, `data/`, and `presentation/` layers.
- `e2e/maestro/`: Maestro E2E flows for the RN app.
- `supabase/`: Supabase migrations/config.
- `app/`, `gradle/`, `build.gradle`: legacy Android app (kept for reference during migration).
- `docs/`: project documentation and specs.

## Build, Test, and Development Commands
Run from `mobile/` unless noted.
- `npm install` - install dependencies (applies `patch-package` postinstall).
- `npm run start` - Metro dev server.
- `npm run ios` / `npm run android` - build and run on simulator/device.
- `npm run lint` - ESLint.
- `npm run typecheck` - TypeScript type check.
- `npm test` - Jest unit/UI tests.
- `npm run e2e` - Maestro flows in `../e2e/maestro`.

## Coding Style & Naming Conventions
- TypeScript/React Native; 2-space indentation is the local convention.
- Components/screens in PascalCase; hooks `useX`; `testID`s are kebab-case.
- Keep domain logic in `domain/` or `data/`, UI in `presentation/`.
- Use `patch-package` for native module fixes (`mobile/patches/`).

## Testing Guidelines
- Unit/UI tests: Jest + Testing Library in `mobile/__tests__/` (`*.test.tsx`).
- E2E: Maestro flows in `e2e/maestro/`. Use `EXPO_PUBLIC_APP_MODE=mock` for deterministic data.
- Add tests for new screens and repositories; prefer stable selectors via `testID`.

## Commit & Pull Request Guidelines
- Follow existing commit style (examples: `hotfix - ...`, `Update-project - ...`); keep messages short and imperative.
- PRs should include: summary, test commands run, and screenshots for UI changes.
- Link related issues/tickets when available.

## Security & Configuration Tips
- Environment variables live in `mobile/.env` (see `mobile/.env.example`).
- Do not commit secrets (Supabase keys, OAuth client secrets).
