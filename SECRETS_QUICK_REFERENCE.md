# GitHub Secrets Quick Reference

## Overview
This document provides a quick reference for all required GitHub secrets, organized by purpose. See `GITHUB_SECRETS_SETUP_GUIDE.md` for detailed setup instructions.

---

## Total: 25 Secrets

### ✅ General Configuration (1)
| Secret Name | Purpose | Encoded? |
|-------------|---------|----------|
| `ENV_FILE` | Environment variables (.env file content) | No |

---

## Android Secrets (8 total)

### 🔥 Firebase - Production (1)
| Secret Name | Purpose | Encoded? |
|-------------|---------|----------|
| `GOOGLE_SERVICES_JSON_BASE64` | Production Firebase config for Android | Yes (base64) |

### 🔥 Firebase - Development (2)
| Secret Name | Purpose | Encoded? |
|-------------|---------|----------|
| `GOOGLE_SERVICES_JSON_BASE64_DEV` | Dev Firebase config for Android | Yes (base64) |
| `FIREBASE_APP_ID_ANDROID_DEV` | Dev Firebase App ID | No |

### 🔐 Play Store Release Signing (4)
| Secret Name | Purpose | Encoded? |
|-------------|---------|----------|
| `ANDROID_KEYSTORE_BASE64` | Release keystore file | Yes (base64) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | No |
| `ANDROID_KEY_ALIAS` | Key alias name | No |
| `ANDROID_KEY_ALIAS_PASSWORD` | Key alias password | No |

### 📦 Play Store Upload (1)
| Secret Name | Purpose | Encoded? |
|-------------|---------|----------|
| `PLAY_SERVICE_ACCOUNT_JSON` | Service account for Play Console | No (raw JSON) |

---

## iOS Secrets (15 total)

### 🔥 Firebase - Production (1)
| Secret Name | Purpose | Encoded? |
|-------------|---------|----------|
| `GOOGLE_SERVICE_INFO_PLIST_BASE64` | Production Firebase config for iOS | Yes (base64) |

### 🔥 Firebase - Development (2)
| Secret Name | Purpose | Encoded? |
|-------------|---------|----------|
| `GOOGLE_SERVICE_INFO_PLIST_BASE64_DEV` | Dev Firebase config for iOS | Yes (base64) |
| `FIREBASE_APP_ID_IOS_DEV` | Dev Firebase App ID | No |

### 🍎 General iOS (2)
| Secret Name | Purpose | Encoded? |
|-------------|---------|----------|
| `IOS_TEAM_ID` | Apple Developer Team ID | No |
| `IOS_KEYCHAIN_PASSWORD` | Temporary keychain password for CI | No |

### 📱 App Store Release Signing (4)
| Secret Name | Purpose | Encoded? |
|-------------|---------|----------|
| `IOS_DIST_CERT_P12_BASE64` | Distribution certificate (.p12) | Yes (base64) |
| `IOS_DIST_CERT_PASSWORD` | Distribution certificate password | No |
| `IOS_PROFILE_BASE64` | App Store provisioning profile | Yes (base64) |
| `IOS_PROFILE_NAME` | App Store provisioning profile name | No |

### 🚀 App Store Connect Upload (3)
| Secret Name | Purpose | Encoded? |
|-------------|---------|----------|
| `APP_STORE_CONNECT_API_KEY_ID` | App Store Connect API Key ID | No |
| `APP_STORE_CONNECT_API_KEY_ISSUER_ID` | App Store Connect API Issuer ID | No |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | App Store Connect API key (.p8 file) | Yes (base64) |

### 🧪 Development/Ad-Hoc Signing (3)
| Secret Name | Purpose | Encoded? |
|-------------|---------|----------|
| `IOS_ADHOC_KEYCHAIN_PASSWORD` | Temporary keychain password for dev builds | No |
| `IOS_ADHOC_CERT_P12_BASE64` | Development certificate (.p12) | Yes (base64) |
| `IOS_ADHOC_CERT_PASSWORD` | Development certificate password | No |
| `IOS_ADHOC_PROFILE_BASE64` | Development provisioning profile | Yes (base64) |
| `IOS_ADHOC_PROFILE_NAME` | Development provisioning profile name | No |

---

## Shared Secrets (1)

### 🔥 Firebase App Distribution (1)
| Secret Name | Purpose | Encoded? | Used By |
|-------------|---------|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account for Firebase App Distribution | No (raw JSON) | Both Android & iOS dev builds |

---

## Secrets by Workflow

### PR Checks (Android & iOS)
Minimal secrets needed:
- `ENV_FILE`
- `GOOGLE_SERVICES_JSON_BASE64`
- `GOOGLE_SERVICE_INFO_PLIST_BASE64`

### Android Release → Play Store
- `ENV_FILE`
- `GOOGLE_SERVICES_JSON_BASE64` ← **Production**
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_ALIAS_PASSWORD`
- `PLAY_SERVICE_ACCOUNT_JSON`

### Android Firebase Distribution → Dev Testing
- `ENV_FILE`
- `GOOGLE_SERVICES_JSON_BASE64_DEV` ← **Development**
- `FIREBASE_APP_ID_ANDROID_DEV` ← **Development**
- `FIREBASE_SERVICE_ACCOUNT_JSON`

### iOS Release → TestFlight
- `ENV_FILE`
- `GOOGLE_SERVICE_INFO_PLIST_BASE64` ← **Production**
- `IOS_TEAM_ID`
- `IOS_KEYCHAIN_PASSWORD`
- `IOS_DIST_CERT_P12_BASE64`
- `IOS_DIST_CERT_PASSWORD`
- `IOS_PROFILE_BASE64`
- `IOS_PROFILE_NAME`
- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_API_KEY_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY_CONTENT`

### iOS Firebase Distribution → Dev Testing
- `ENV_FILE`
- `GOOGLE_SERVICE_INFO_PLIST_BASE64_DEV` ← **Development**
- `FIREBASE_APP_ID_IOS_DEV` ← **Development**
- `IOS_TEAM_ID`
- `IOS_ADHOC_KEYCHAIN_PASSWORD`
- `IOS_ADHOC_CERT_P12_BASE64`
- `IOS_ADHOC_CERT_PASSWORD`
- `IOS_ADHOC_PROFILE_BASE64`
- `IOS_ADHOC_PROFILE_NAME`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

---

## Important: Dev vs Prod Firebase Separation

### Why Separate Firebase Projects?

1. **Data Isolation**: Dev testing doesn't affect production data
2. **Analytics Separation**: Keep dev/test events separate from real user analytics
3. **Push Notification Testing**: Test notifications without spamming real users
4. **Crashlytics**: Dev crashes don't pollute production crash reports

### Firebase Configuration Summary

| Platform | Environment | Secret Name | Bundle/Package ID |
|----------|-------------|-------------|-------------------|
| Android | Production | `GOOGLE_SERVICES_JSON_BASE64` | `com.edufelip.finn` |
| Android | Development | `GOOGLE_SERVICES_JSON_BASE64_DEV` | `com.edufelip.finn` or `.dev` |
| iOS | Production | `GOOGLE_SERVICE_INFO_PLIST_BASE64` | `com.edufelip.finn` |
| iOS | Development | `GOOGLE_SERVICE_INFO_PLIST_BASE64_DEV` | `com.edufelip.finn.dev` |

### Setup Options

**Option A: Separate Firebase Projects (Recommended)**
- Create two Firebase projects: "Finn Production" and "Finn Dev"
- Each has its own Android/iOS apps
- Complete isolation between environments

**Option B: Same Project, Different Apps**
- One Firebase project: "Finn"
- Add multiple apps to the project:
  - Android: `com.edufelip.finn` (production)
  - Android: `com.edufelip.finn.dev` (development)
  - iOS: `com.edufelip.finn` (production)
  - iOS: `com.edufelip.finn.dev` (development)
- Shared project resources but separate app configs

---

## Base64 Encoding Quick Reference

### macOS
```bash
base64 -i file.ext | pbcopy  # Copies to clipboard
```

### Linux
```bash
base64 -w 0 file.ext  # Outputs to terminal (copy manually)
```

### Windows (PowerShell)
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("file.ext"))
```

---

## Validation Checklist

Before pushing to GitHub, verify:

- [ ] All 25 secrets are added to GitHub → Settings → Secrets and variables → Actions
- [ ] Secret names match exactly (case-sensitive)
- [ ] Base64-encoded secrets don't have line breaks or spaces
- [ ] JSON secrets (service accounts) are raw JSON, not base64
- [ ] Firebase dev configs use `_DEV` suffix secrets
- [ ] Firebase prod configs use non-suffixed secrets
- [ ] iOS bundle IDs match: prod = `com.edufelip.finn`, dev = `com.edufelip.finn.dev`
- [ ] Android package matches: `com.edufelip.finn`

---

## What's Different from Meer Project?

The Finn project structure differs from Meer in:
- **Monorepo structure**: Finn has `mobile/` subdirectory, Meer doesn't
- **Package manager**: Finn uses npm, Meer uses yarn
- **Working directories**: Finn workflows use `working-directory: mobile`

All secrets are adapted to work with Finn's structure while maintaining Meer's best practices for environment separation and validation.

---

For detailed setup instructions, see: **GITHUB_SECRETS_SETUP_GUIDE.md**
