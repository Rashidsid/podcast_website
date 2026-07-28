import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const CHANNEL_ID = 'UCm5aAm2T6ezrPqCH0CdmXXw';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  publishedAt: string;
  viewCount: string;
}

function parseISODuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || [];
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API request failed (${res.status}): ${body}`);
  }
  return res.json();
}

export default async (req: VercelRequest, res: VercelResponse) => {
  // Verify the request is from GitHub Actions (using a secret token)
  const authToken = req.headers['x-auth-token'];
  if (authToken !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting YouTube fetch...');

    // Search for latest videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
    searchUrl.searchParams.set('channelId', CHANNEL_ID);
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('order', 'date');
    searchUrl.searchParams.set('maxResults', '16');
    searchUrl.searchParams.set('type', 'video');

    console.log('📡 Fetching video list from YouTube...');
    const searchData: any = await fetchJson(searchUrl.toString());
    const ids = (searchData.items || [])
      .map((item: any) => item.id?.videoId)
      .filter(Boolean);

    if (!ids.length) {
      console.warn('⚠️ No videos found');
      return res.status(200).json({ message: 'No videos found' });
    }

    // Get video details
    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videosUrl.searchParams.set('key', YOUTUBE_API_KEY);
    videosUrl.searchParams.set('id', ids.join(','));
    videosUrl.searchParams.set('part', 'snippet,contentDetails,statistics');

    console.log('📡 Fetching video details...');
    const videosData: any = await fetchJson(videosUrl.toString());

    const videos: YouTubeVideo[] = (videosData.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl:
        item.snippet.thumbnails?.maxres?.url ??
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url ??
        '',
      duration: parseISODuration(item.contentDetails.duration),
      publishedAt: item.snippet.publishedAt,
      viewCount: item.statistics?.viewCount?.toString() ?? '0',
    }));

    // Get channel statistics
    const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
    channelUrl.searchParams.set('key', YOUTUBE_API_KEY);
    channelUrl.searchParams.set('id', CHANNEL_ID);
    channelUrl.searchParams.set('part', 'statistics');

    console.log('📡 Fetching channel statistics...');
    const channelData: any = await fetchJson(channelUrl.toString());
    const stats = channelData.items?.[0]?.statistics ?? {};

    // Save to Firestore
    console.log('💾 Saving to Firestore...');
    await db.collection('youtubeCache').doc('latest_videos').set({
      videos: videos,
      lastFetched: admin.firestore.Timestamp.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'success',
      videoCount: videos.length,
    });

    await db.collection('youtubeCache').doc('channel_stats').set({
      subscriberCount: stats.subscriberCount?.toString() ?? '0',
      viewCount: stats.viewCount?.toString() ?? '0',
      videoCount: stats.videoCount?.toString() ?? '0',
      lastUpdated: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Successfully cached ${videos.length} videos!`);
    return res.status(200).json({ success: true, videosCount: videos.length });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
