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
