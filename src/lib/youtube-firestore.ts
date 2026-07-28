// Firebase config - add these to your .env file
// VITE_FIREBASE_API_KEY=your_key_here
// VITE_FIREBASE_PROJECT_ID=podcast-9485d
// VITE_FIREBASE_AUTH_DOMAIN=podcast-9485d.firebaseapp.com
// VITE_FIREBASE_DATABASE_URL=https://podcast-9485d.firebaseio.com
// VITE_FIREBASE_STORAGE_BUCKET=podcast-9485d.appspot.com
// VITE_FIREBASE_MESSAGING_SENDER_ID=your_id_here
// VITE_FIREBASE_APP_ID=your_app_id_here

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';

// Get config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  duration: string
  publishedAt: string
  viewCount: string
}

export interface YouTubeChannelStatistics {
  subscriberCount: string
  viewCount: string
  videoCount: string
}

export interface YouTubeComment {
  id: string
  authorDisplayName: string
  authorProfileImageUrl: string
  textDisplay: string
  publishedAt: string
  likeCount: number
}

/**
 * Get latest YouTube videos from Firestore cache
 * The cache is automatically refreshed by a Cloud Function every 24 hours
 */
export async function getLatestYouTubeVideos(channelId: string, maxResults = 12): Promise<YouTubeVideo[]> {
  try {
    const docRef = doc(db, 'youtubeCache', 'latest_videos');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const videos = data.videos || [];
      
      // Return only the requested number of videos
      return videos.slice(0, maxResults);
    }

    console.warn('No cached videos found');
    return [];
  } catch (error) {
    console.error('Error fetching cached videos:', error);
    return [];
  }
}

/**
 * Get YouTube channel statistics from Firestore cache
 */
export async function getYouTubeChannelStatistics(channelId: string): Promise<YouTubeChannelStatistics> {
  try {
    const docRef = doc(db, 'youtubeCache', 'channel_stats');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as YouTubeChannelStatistics;
    }

    // Return default empty stats if not found
    return {
      subscriberCount: '0',
      viewCount: '0',
      videoCount: '0',
    };
  } catch (error) {
    console.error('Error fetching channel stats:', error);
    return {
      subscriberCount: '0',
      viewCount: '0',
      videoCount: '0',
    };
  }
}

/**
 * Get latest YouTube comments from Firestore cache
 */
export async function getLatestYouTubeComments(videoId: string, maxResults = 12): Promise<YouTubeComment[]> {
  try {
    const docRef = doc(db, 'youtubeCache', 'latest_comments');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const comments = data.comments || [];
      
      // Return only the requested number of comments
      return comments.slice(0, maxResults);
    }

    return [];
  } catch (error) {
    console.error('Error fetching cached comments:', error);
    return [];
  }
}

/**
 * Check if cache has expired
 */
export async function isCacheExpired(): Promise<boolean> {
  try {
    const docRef = doc(db, 'youtubeCache', 'latest_videos');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
      return new Date() > expiresAt;
    }

    return true; // Consider expired if not found
  } catch (error) {
    console.error('Error checking cache expiration:', error);
    return true;
  }
}
