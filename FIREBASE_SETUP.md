# Firebase Caching Setup for YouTube Videos

## ✅ What's Been Done

1. ✅ Firebase Firestore collection created (`youtubeCache`)
2. ✅ Firestore document structure initialized (`latest_videos`)
3. ✅ New Firestore-based YouTube module created (`youtube-firestore.ts`)
4. ✅ Cloud Function created for automatic daily refreshes

## 📋 Next Steps to Complete Setup

### Step 1: Get Firebase Web Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project `podcast-9485d`
3. Click **Settings** (gear icon) → **Project Settings**
4. Scroll to **Your apps** section
5. Click the Web app registration (if it doesn't exist, create one)
6. Copy the Firebase configuration
7. In your `.env` file, replace these placeholders:
   - `VITE_FIREBASE_API_KEY` 
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### Step 2: Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### Step 3: Initialize Firebase Functions
```bash
cd functions
npm install firebase-functions firebase-admin node-fetch
cd ..
```

### Step 4: Deploy Cloud Function
```bash
firebase deploy --only functions
```

The function will automatically run **every day at midnight UTC** to fetch and cache YouTube videos.

### Step 5: Switch to Firestore in Your App

In your `App.tsx`, change the import:
```typescript
// Old import:
// import { getLatestYouTubeVideos, ... } from "../lib/youtube"

// New import:
import { getLatestYouTubeVideos, ... } from "../lib/youtube-firestore"
```

### Step 6: Install Firebase Dependencies
```bash
npm install firebase
```

## 🎯 How It Works

**Before (Direct API calls):**
- Every visitor triggers YouTube API call
- Quota: 100 searches/day
- Gets exhausted with traffic

**After (Firestore Caching):**
- Cloud Function fetches from YouTube **once per day**
- All visitors get cached videos (no API calls)
- Quota: Only 1 call per day
- Scales to unlimited visitors

## 📊 Monitoring

Check your cached videos anytime:
1. Firebase Console → Firestore Database
2. Open `youtubeCache` collection
3. View `latest_videos` document

## 🔄 Manual Refresh (Optional)

If you want to manually refresh videos without waiting for the scheduled run:
```bash
firebase functions:shell
> fetchYouTubeVideosManual()
```

## 🐛 Troubleshooting

**Videos not updating?**
- Check Cloud Function logs: Firebase Console → Functions → Logs
- Verify YouTube API key is set in Cloud Function environment variables

**Permission denied errors?**
- Go to Firestore → Security Rules
- Update rules to allow read/write (while in development)

## 🚀 Production Security Rules

Once everything works, update your Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read youtubeCache collection
    match /youtubeCache/{document=**} {
      allow read;
      allow write: if false; // Only Cloud Function can write
    }
  }
}
```

## 📝 Files Modified/Created

- ✅ `src/lib/youtube-firestore.ts` - Firestore-based video fetching
- ✅ `functions/fetchYouTubeVideos.ts` - Cloud Function (auto-refresh daily)
- ✅ `.env` - Firebase configuration variables
- ✅ `firebase-setup.mjs` - One-time setup script (already run)

## 🎉 Result

- ✅ Unlimited scalability
- ✅ No more quota exhaustion
- ✅ Fast loading (cached data)
- ✅ Only 1 YouTube API call per day
- ✅ Automatic daily updates
