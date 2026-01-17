# Finn Mobile (React Native + Expo)

## Quick Start
```bash
cp .env.example .env
npm install
npm run ios
```

## Prebuild Note
Expo prebuild has been run once to generate `ios/` and `android/`.
Manage native projects directly going forward; avoid re-running prebuild unless explicitly planned.

## Environment
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_APP_MODE` (optional: set to `mock` for deterministic E2E runs)

## Tests
```bash
npm test
```

## Remote Supabase Init (CLI)
Requires Supabase CLI and an authenticated session.
```bash
supabase login
./scripts/supabase-remote-init.sh
```
Applies `supabase/migrations/*` to the linked remote project. Use `supabase/remote_init.sql`
only for manual SQL editor runs.

## Remote Supabase Seed (CLI)
Run only against dev/staging, not production.
```bash
supabase login
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
./scripts/supabase-remote-seed.sh
```
Uses Supabase Admin API via `scripts/seed-remote.js` to create users and data.
Will refuse to seed if the linked project matches the prod ref; set `SUPABASE_ALLOW_PROD_SEED=true` to override.

## E2E (Maestro)
Run with mock mode for deterministic data:
```bash
cd mobile
EXPO_PUBLIC_APP_MODE=mock npm run ios
cd ..
maestro test e2e/maestro
```

## Structure
- `src/app`: app bootstrap + providers
- `src/domain`: core models and repository interfaces
- `src/data`: Supabase and offline/caching layers
- `src/presentation`: navigation + screens
