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

function parseISODuration(duration: string) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || []
  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const seconds = Number(match[3] ?? 0)
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`YouTube API request failed (${res.status}): ${body}`)
  }
  return res.json()
}

export async function getLatestYouTubeVideos(channelId: string, maxResults = 12): Promise<YouTubeVideo[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (!apiKey) throw new Error("Missing VITE_YOUTUBE_API_KEY environment variable.")
  if (!channelId) throw new Error("Missing YouTube channel ID.")

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search")
  searchUrl.searchParams.set("key", apiKey)
  searchUrl.searchParams.set("channelId", channelId)
  searchUrl.searchParams.set("part", "snippet")
  searchUrl.searchParams.set("order", "date")
  searchUrl.searchParams.set("maxResults", String(maxResults))
  searchUrl.searchParams.set("type", "video")

  const searchData = await fetchJson(searchUrl.toString())
  const ids = (searchData.items || []).map((item: any) => item.id?.videoId).filter(Boolean)
  if (!ids.length) return []

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos")
  videosUrl.searchParams.set("key", apiKey)
  videosUrl.searchParams.set("id", ids.join(","))
  videosUrl.searchParams.set("part", "snippet,contentDetails,statistics")

  const videosData = await fetchJson(videosUrl.toString())

  return (videosData.items || []).map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails?.maxres?.url ?? item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? "",
    duration: parseISODuration(item.contentDetails.duration),
    publishedAt: item.snippet.publishedAt,
    viewCount: item.statistics?.viewCount?.toString() ?? "0",
  }))
}

export async function getYouTubeChannelStatistics(channelId: string): Promise<YouTubeChannelStatistics> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (!apiKey) throw new Error("Missing VITE_YOUTUBE_API_KEY environment variable.")
  if (!channelId) throw new Error("Missing YouTube channel ID.")

  const url = new URL("https://www.googleapis.com/youtube/v3/channels")
  url.searchParams.set("key", apiKey)
  url.searchParams.set("id", channelId)
  url.searchParams.set("part", "statistics")

  const data = await fetchJson(url.toString())
  const stats = data.items?.[0]?.statistics ?? {}
  return {
    subscriberCount: stats.subscriberCount?.toString() ?? "0",
    viewCount: stats.viewCount?.toString() ?? "0",
    videoCount: stats.videoCount?.toString() ?? "0",
  }
}

export async function getLatestYouTubeComments(videoId: string, maxResults = 12): Promise<YouTubeComment[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (!apiKey) throw new Error("Missing VITE_YOUTUBE_API_KEY environment variable.")
  if (!videoId) throw new Error("Missing YouTube video ID.")

  const url = new URL("https://www.googleapis.com/youtube/v3/commentThreads")
  url.searchParams.set("key", apiKey)
  url.searchParams.set("videoId", videoId)
  url.searchParams.set("part", "snippet")
  url.searchParams.set("order", "relevance")
  url.searchParams.set("maxResults", String(maxResults))

  const data = await fetchJson(url.toString())
  return (data.items || []).map((item: any) => ({
    id: item.id,
    authorDisplayName: item.snippet.topLevelComment.snippet.authorDisplayName,
    authorProfileImageUrl: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
    textDisplay: item.snippet.topLevelComment.snippet.textDisplay,
    publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
    likeCount: item.snippet.topLevelComment.snippet.likeCount ?? 0,
  }))
}
