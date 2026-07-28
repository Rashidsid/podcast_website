# Free YouTube Caching Setup (No Firebase Upgrade Needed!)

## Overview
Uses **Vercel Serverless Function** + **GitHub Actions** to fetch YouTube videos daily at no cost.

---

## Step 1: Get Firebase Service Account Credentials

1. Go to: https://console.firebase.google.com/project/podcast-9485d/settings/serviceaccounts/adminsdk
2. Click **"Generate New Private Key"** button
3. A JSON file downloads - **keep it secret!**
4. Open the JSON file and copy these values:
   - `project_id`
   - `client_email`
   - `private_key` (the long string with \n)

---

## Step 2: Add Environment Variables to Vercel

1. Go to: https://vercel.com/dashboard/project/podcast (or your project)
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Variable Name | Value |
|---|---|
| `FIREBASE_PROJECT_ID` | From service account JSON |
| `FIREBASE_CLIENT_EMAIL` | From service account JSON |
| `FIREBASE_PRIVATE_KEY` | From service account JSON (the private_key field) |
| `YOUTUBE_API_KEY` | `AIzaSyARe_LDFt0r5iaS4qZ93fufs5CSOEHwY4` |
| `CRON_SECRET` | Generate a random string: `openssl rand -hex 32` |

**For FIREBASE_PRIVATE_KEY**: Copy the entire string including quotes and \n characters exactly as shown in JSON.

---

## Step 3: Deploy to Vercel

Run in your project folder:
```bash
npm run build
npm run deploy
```

Or push to GitHub and Vercel will auto-deploy.

After deployment, get your function URL:
- Check Vercel dashboard: **Deployments** → Find `api/fetchYouTubeVideos.ts`
- The URL will be: `https://your-project.vercel.app/api/fetchYouTubeVideos`

---

## Step 4: Set GitHub Actions Secrets

1. Go to: https://github.com/Rashidsid/podcast_website/settings/secrets/actions
2. Click **"New repository secret"**
3. Add these secrets:

| Secret Name | Value |
|---|---|
| `CRON_SECRET` | Same value you used in Vercel env variables |
| `VERCEL_FUNCTION_URL` | The full URL from Step 3 |

---

## Step 5: Test the Setup

### Option A: Manual Test via GitHub Actions
1. Go to: https://github.com/Rashidsid/podcast_website/actions
2. Click **"Fetch YouTube Videos Daily"** workflow
3. Click **"Run workflow"** → **"Run workflow"** button
4. Wait ~30 seconds and check Firestore console to see if videos were cached

### Option B: Manual Test via Terminal
```bash
curl -X GET \
  -H "x-auth-token: YOUR_CRON_SECRET" \
  "https://your-project.vercel.app/api/fetchYouTubeVideos"
```

### Option C: Check Firestore
1. Go to: https://console.firebase.google.com/project/podcast-9485d/firestore
2. Click **youtubeCache** collection
3. You should see `latest_videos` and `channel_stats` documents updated

---

## How It Works

```
Every Day at Midnight UTC (GitHub Actions triggers)
        ↓
Calls Vercel Function with CRON_SECRET
        ↓
Vercel Function fetches from YouTube API
        ↓
Writes to Firestore (same as before)
        ↓
Your app reads from Firestore cache
        ↓
✅ No per-visitor API calls!
```

---

## Cost: $0 per month

✅ Vercel: Free tier (500 function invocations/month, you use ~30)
✅ GitHub Actions: Free tier (2000 minutes/month, you use ~1)
✅ Firestore: Free tier (1 write/day + reads, stays well within limits)
✅ YouTube API: 1 quota unit/day (out of 100 quota limit)

---

## Troubleshooting

**Error: "Unauthorized"**
- Check that CRON_SECRET matches in both Vercel and GitHub Actions

**Error: "Firebase credential error"**
- Verify FIREBASE_PRIVATE_KEY includes the literal `\n` characters
- Make sure it's the complete string from the JSON file

**Videos not updating**
- Check GitHub Actions workflow runs: https://github.com/Rashidsid/podcast_website/actions
- Check Vercel function logs: https://vercel.com/dashboard (click function)
- Check Firestore: https://console.firebase.google.com/project/podcast-9485d/firestore

---

## Next Steps

1. Get Firebase service account credentials
2. Add environment variables to Vercel
3. Deploy to Vercel
4. Add GitHub Actions secrets
5. Test the workflow
6. Push to GitHub
