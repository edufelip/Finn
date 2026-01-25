# Firebase Configuration Setup

This project uses Firebase for crash reporting and analytics. The Firebase configuration files contain sensitive credentials and are **not committed to git**.

## For Local Development

### iOS Setup
1. Get your `GoogleService-Info.plist` from the [Firebase Console](https://console.firebase.google.com)
2. Copy it to: `ios/FinnDev/GoogleService-Info.plist`
3. The file is already referenced in the Xcode project - just replace the placeholder

### Android Setup
1. Get your `google-services.json` from the [Firebase Console](https://console.firebase.google.com)
2. Copy it to: `android/app/google-services.json`
3. The Gradle build will automatically pick it up

## For CI/CD

The CI workflows automatically inject the production Firebase configuration files from GitHub Secrets:
- iOS: `GOOGLE_SERVICE_INFO_PLIST_BASE64`
- Android: `GOOGLE_SERVICES_JSON_BASE64`

These secrets contain base64-encoded versions of the production Firebase config files.

## Important Notes

- ✅ Placeholder files are committed to git (with dummy values)
- ❌ Do not commit real Firebase credentials to the repository
- 🔒 Production credentials are managed via CI secrets
- 📝 Each developer should use their own Firebase project for local testing

### Preventing Accidental Commits

After replacing the placeholder files with your real credentials, tell git to ignore changes:

```bash
# iOS
git update-index --assume-unchanged ios/FinnDev/GoogleService-Info.plist

# Android
git update-index --assume-unchanged android/app/google-services.json
```

To undo this (e.g., when updating the placeholder):
```bash
git update-index --no-assume-unchanged ios/FinnDev/GoogleService-Info.plist
git update-index --no-assume-unchanged android/app/google-services.json
```

## Verifying Your Setup

### iOS
```bash
# Check if your file exists and is valid
plutil -lint ios/FinnDev/GoogleService-Info.plist
```

### Android
```bash
# Check if your file exists and is valid JSON
cat android/app/google-services.json | python3 -m json.tool
```
