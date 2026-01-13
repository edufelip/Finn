<h1 align="center">Finn</h1>

<p align="center">
  <a href="https://android-arsenal.com/api?level=24"><img alt="API" src="https://img.shields.io/badge/API-24%2B-brightgreen.svg?style=flat"/></a>
  <a href="https://github.com/edufelip"><img alt="Build Status" src="https://img.shields.io/static/v1?label=Android CI&message=passing&color=green&logo=android"/></a>
  <a href="https://medium.com/@eduardofelipi"><img alt="Medium" src="https://img.shields.io/static/v1?label=Medium&message=@edu_santos&color=gray&logo=medium"/></a> <br>
  <a href="https://www.youtube.com/channel/UCYcwwX7nDU_U0FP-TsXMwVg"><img alt="Profile" src="https://img.shields.io/static/v1?label=Youtube&message=edu_santos&color=red&logo=youtube"/></a> 
  <a href="https://github.com/edufelip"><img alt="Profile" src="https://img.shields.io/static/v1?label=Github&message=edufelip&color=white&logo=github"/></a> 
  <a href="https://www.linkedin.com/in/eduardo-felipe-dev/"><img alt="Linkedin" src="https://img.shields.io/static/v1?label=Linkedin&message=edu_santos&color=blue&logo=linkedin"/></a> 
</p>

<p align="center">  
🗡️ Finn is a social media that let you create communities and post about the things you love!
</p>

<p align="center">
<img src="https://github.com/edufelip/finn/assets/34727187/f55b5475-8718-4891-a468-8896ec113a2e"/>
</p>

## Download
Go to [Google Play](https://play.google.com/store/apps/details?id=com.edufelip.finn) to download the latest App version.

## React Native rewrite (in progress)
The React Native + Expo app lives in `mobile/`.

Quick start:
```bash
cd mobile
npm install
npm run ios
```

## Environments: Dev vs Prod

Finn supports separate development and production environments with complete isolation:
- Different app identifiers (separate installs on device)
- Different Supabase projects (isolated databases)
- Different push notification endpoints (no cross-environment notifications)

### Setup

#### 1. Configure Environment Files

Create two environment files in `mobile/`:

**`.env.production`** (already contains your prod credentials):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_APP_ENV=prod
```

**`.env.development`** (create a separate Supabase project for dev):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_APP_ENV=dev
```

#### 2. Run Database Migration

Run the migration on **both** your dev and prod Supabase projects:

```sql
-- Add env column to push_tokens table
ALTER TABLE push_tokens
ADD COLUMN IF NOT EXISTS env TEXT NOT NULL DEFAULT 'prod';

CREATE INDEX IF NOT EXISTS idx_push_tokens_env ON push_tokens(env);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_env ON push_tokens(user_id, env);
```

The migration file is available at: `mobile/supabase/migrations/add_env_to_push_tokens.sql`

#### 3. Install Dependencies

```bash
cd mobile
npm install
```

### Running Each Environment

**Development:**
```bash
npm run start:dev       # Start dev Expo server
npm run ios:dev         # Run iOS dev build
npm run android:dev     # Run Android dev build
```

**Production:**
```bash
npm run start:prod      # Start prod Expo server
npm run ios:prod        # Run iOS prod build
npm run android:prod    # Run Android prod build
```

**Default (uses current .env):**
```bash
npm start               # Start Expo server
npm run ios             # Run iOS build
npm run android         # Run Android build
```

### App Identifiers

Each environment has distinct identifiers so they install as separate apps:

| Environment | Android Package | iOS Bundle ID | App Name |
|-------------|----------------|---------------|----------|
| Production  | `com.edufelip.finn` | `com.edufelip.finn` | Finn |
| Development | `com.edufelip.finn.dev` | `com.edufelip.finn.dev` | Finn Dev |

### Testing Push Notifications

1. **Register for notifications** in each environment separately
2. **Verify tokens are stored with correct env**:
   ```sql
   SELECT user_id, platform, env, token FROM push_tokens;
   ```
3. **Send test notification** from Supabase (or your backend):
   - Filter tokens by `env = 'dev'` for dev notifications
   - Filter tokens by `env = 'prod'` for prod notifications
4. **Verify isolation**: Notifications sent to dev should only reach dev app installs

### Backend Push Notification Sending

When sending push notifications from your backend/edge functions, always filter by environment:

```typescript
// Example: Fetch push tokens for a specific environment
const { data: tokens } = await supabase
  .from('push_tokens')
  .select('token')
  .eq('user_id', userId)
  .eq('env', 'dev'); // or 'prod'

// Send notifications using Expo Push API
```

### Troubleshooting

- **Wrong Supabase connection**: Check that `EXPO_PUBLIC_SUPABASE_URL` matches your intended environment
- **Push tokens mixing**: Verify the migration was run and tokens have the `env` column
- **App not installing separately**: Rebuild with `expo run:ios:dev` or `expo run:android:dev` to apply new bundle/package IDs

## This project uses
* MVVM Architecture and LiveData
* Retrofit
* RxJava
* Hilt
* Glide
* FirebaseAuth
* ViewPager

## Installation
Clone this repository and import into **Android Studio**
```bash
git clone https://github.com/edufelip/finn.git
```
or

```bash
git clone git@github.com:edufelip/finn.git
```

## Layouts
<br>
  <p align="left">
            <img alt="splash screen"
            src="https://github.com/edufelip/finn/assets/34727187/1af2621d-21d5-4e06-a02b-6859336a19d1" width="24%" 
            title="splash screen">
            <img alt="main screen"
            src="https://github.com/edufelip/finn/assets/34727187/828c2285-7e8c-4356-849f-584fa4ba3324" width="24%" 
            title="main screen">
            <img alt="main screen dark"
            src="https://github.com/edufelip/finn/assets/34727187/0ca5cb51-c091-4018-b419-134885950c30" width="24%" 
            title="main screen dark">
            <img alt="main screen dark"
            src="https://github.com/edufelip/finn/assets/34727187/22b9aaea-4ef2-477f-914b-0cd74231bd1c" width="24%" 
            title="main screen dark">

## Generating APK
From Android Studio:
1. ***Build*** menu
2. Generate ***Bundle(s) / APK(s)***
3. Build ***APK(s)***
4. Wait for Android studio to build the APK

## Maintainers
This project is mantained by:
* [Eduardo Felipe](http://github.com/edufelip)

## Contributing

1. Fork it
2. Create your feature branch (git checkout -b my-new-feature)
3. Commit your changes (git commit -m 'Add some feature')
4. Push your branch (git push origin my-new-feature)
5. Create a new Pull Request
