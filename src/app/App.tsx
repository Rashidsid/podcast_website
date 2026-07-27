import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react"
import {
  Play, Pause, Download, Share2, Search, X, Menu,
  Moon, Sun, ArrowRight, Star, Facebook, Instagram,
  Youtube, Mail, Headphones,
  Mic2, Clock, Check, ExternalLink, Rss, Volume2,
  SkipBack, SkipForward, ChevronLeft, ChevronRight,
  ChevronDown,
  Bookmark, TrendingUp, Globe, Zap
} from "lucide-react"
import { getLatestYouTubeComments, getLatestYouTubeVideos, getYouTubeChannelStatistics, YouTubeChannelStatistics, YouTubeComment, YouTubeVideo } from "../lib/youtube"
import studioImage from "../img/main.jpg"

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatLargeNumber(value: string | number) {
  return Number(value).toLocaleString("en-US")
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Episode {
  id: string | number; title: string; description: string; duration: string
  date: string; category: string; guests: string[]; color: string;
  photo?: string; num?: number; thumbnailUrl?: string; publishedAt?: string; viewCount?: string; videoId?: string
}
interface Host { name: string; role: string; bio: string; photo: string; twitter: string; linkedin: string }
interface Testimonial { name: string; handle: string; text: string; rating: number; avatar: string; platform: string }

// ── Data ───────────────────────────────────────────────────────────────────────
const EPISODES: Episode[] = [
  { id: 1, title: "The AI Takeover: Myth vs. Reality", description: "We dig into the breathless AI headlines and separate signal from noise with Dr. Priya Mehta, whose safety paper became the most-cited work of 2026.", duration: "58:32", date: "Jul 20, 2026", category: "Technology", guests: ["Dr. Priya Mehta"], photo: "1478737270239-2f02b77fc618", num: 142, color: "#7c3aed" },
  { id: 2, title: "Building in Public: The New Creator Economy", description: "Transparency as a growth strategy — and what the next wave of indie creators are doing that the last generation didn't.", duration: "1:12:08", date: "Jul 13, 2026", category: "Business", guests: ["Tom Okonkwo", "Sara Lindström"], photo: "1611532736597-de2d4265fba3", num: 141, color: "#0ea5e9" },
  { id: 3, title: "Dark Patterns: How Apps Manipulate Us", description: "A deep investigation into deceptive UI design and the growing regulatory and grassroots movement pushing back hard.", duration: "47:19", date: "Jul 6, 2026", category: "Design", guests: ["Yuki Tanaka"], photo: "1558618666-fcd25c85cd64", num: 140, color: "#f97316" },
  { id: 4, title: "Open Source Everything", description: "What happens when critical infrastructure is built by volunteers — and then exploited by nation states and trillion-dollar corporations?", duration: "1:05:44", date: "Jun 29, 2026", category: "Technology", guests: ["Felix Wagner"], photo: "1555066931-4365d14bab8c", num: 139, color: "#10b981" },
  { id: 5, title: "The Future of Remote Work", description: "Four years after the great dispersal, we audit what we've actually learned. Office mandates, async culture, and the unexpected losers.", duration: "52:11", date: "Jun 22, 2026", category: "Culture", guests: ["Aisha Kamara", "Raj Patel"], photo: "1522202176988-66273c2fd55f", num: 138, color: "#f43f5e" },
  { id: 6, title: "Web3 After the Crash", description: "The hype cycle is over. We survey what actually survived the crypto winter and what's quietly growing in the wreckage.", duration: "44:55", date: "Jun 15, 2026", category: "Business", guests: ["Carlos Reyes"], photo: "1639762681057-408e52192e55", num: 137, color: "#8b5cf6" },
  { id: 7, title: "The Attention Economy is Broken", description: "Social platforms promised connection. What they delivered was something far more corrosive — and researchers are only now quantifying the damage.", duration: "1:01:22", date: "Jun 8, 2026", category: "Society", guests: ["Dr. Laila Hassan"], photo: "1516321318423-f06f85e504b3", num: 136, color: "#ec4899" },
  { id: 8, title: "Manufacturing a Hit: Inside the Algorithm", description: "A former Spotify data scientist explains exactly how recommendation systems shape what we listen to — and who benefits.", duration: "55:40", date: "Jun 1, 2026", category: "Culture", guests: ["Nate Friedman"], photo: "1470225620780-dba8ba36b745", num: 135, color: "#14b8a6" },
]

const CATEGORIES = ["All", "Technology", "Business", "Design", "Culture", "Science", "Society"]

const TESTIMONIALS: Testimonial[] = [
  { name: "Elena Vasquez", handle: "@evasquez_ux", text: "Abdul & Faizan is the podcast I send to every person who joins my team. It's the fastest way to get up to speed on what actually matters in tech right now.", rating: 5, avatar: "1438761681033-6461ffad8d80", platform: "Apple Podcasts" },
  { name: "Marcus Webb", handle: "@mwebb_builds", text: "The research depth here is extraordinary. Maya and James don't just cover the headlines — they explain why things happened the way they did. That's rare.", rating: 5, avatar: "1472099645785-5658abf4ff4e", platform: "Spotify" },
  { name: "Priya Nair", handle: "@pnair_product", text: "I've listened to hundreds of tech podcasts. This one actually changes how I think about problems. That's an incredibly rare thing.", rating: 5, avatar: "1534528741775-53994a69daeb", platform: "Apple Podcasts" },
  { name: "Jordan Kim", handle: "@jordankim_dev", text: "Every single episode has at least one idea that I end up using in my work the same week. That's the bar I hold podcasts to now.", rating: 5, avatar: "1500648767791-00dcc994a43e", platform: "YouTube" },
]

const STATS = [
  { label: "Episodes", value: 142, suffix: "", icon: Mic2 },
  { label: "Monthly Listeners", value: 380, suffix: "K", icon: Headphones },
  { label: "Countries", value: 94, suffix: "", icon: Globe },
  { label: "5-Star Reviews", value: 12400, suffix: "+", icon: Star },
]

const SPONSORS = ["Alhur Wear"]

const FAQS: { q: string; a: string }[] = [
  { q: "How often do you publish episodes?", a: "We publish weekly, usually every Tuesday." },
  { q: "Can I suggest a guest?", a: "Yes — use the contact form to pitch guests or topics." },
  { q: "Do you accept sponsorships?", a: "We do. Please reach out via the contact form for rates." },
]

const YOUTUBE_CHANNEL_ID = (import.meta as any).env?.VITE_YOUTUBE_CHANNEL_ID ?? "UCm5aAm2T6ezrPqCH0CdmXXw"
const COLOR_PALETTE = ["#7c3aed", "#0ea5e9", "#f97316", "#10b981", "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6"]

function formatYoutubeDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function mapYouTubeVideosToEpisodes(videos: YouTubeVideo[]): Episode[] {
  return videos.map((video, index) => ({
    id: video.id,
    videoId: video.id,
    title: video.title,
    description: video.description,
    duration: video.duration,
    date: formatYoutubeDate(video.publishedAt),
    category: "YouTube",
    guests: [],
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    thumbnailUrl: video.thumbnailUrl,
    publishedAt: video.publishedAt,
    viewCount: video.viewCount,
    num: videos.length - index,
  }))
}

// ── Hooks ──────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCounter(target: number, active: boolean, duration = 1800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let rafId: number
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1)
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [active, target, duration])
  return val
}

function useTilt() {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, glare: { x: 50, y: 50 } })
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = (e.clientX - r.left) / r.width
    const cy = (e.clientY - r.top) / r.height
    setTilt({ x: (cy - 0.5) * -14, y: (cx - 0.5) * 14, glare: { x: cx * 100, y: cy * 100 } })
  }, [])
  const onLeave = useCallback(() => setTilt({ x: 0, y: 0, glare: { x: 50, y: 50 } }), [])
  return { ref, tilt, onMove, onLeave }
}

// ── Waveform ───────────────────────────────────────────────────────────────────
function WaveformBars({ playing, bars = 20, color }: { playing: boolean; bars?: number; color?: string }) {
  const cfg = useMemo(() => Array.from({ length: bars }, (_, i) => ({
    lo: 0.08 + ((i * 7) % 5) * 0.05,
    hi: 0.45 + ((i * 11) % 7) * 0.08,
    dur: 0.26 + ((i * 13) % 5) * 0.06,
    dly: ((i * 5) % 7) * 0.04,
  })), [bars])
  return (
    <div className="flex items-center gap-[2px] h-7">
      {cfg.map((c, i) => (
        <motion.div key={i}
          className="w-[3px] h-full rounded-full"
          style={{ transformOrigin: "center", backgroundColor: color ?? "currentColor" }}
          animate={playing ? { scaleY: [c.lo, c.hi, c.lo] } : { scaleY: c.lo }}
          transition={playing ? { repeat: Infinity, duration: c.dur, delay: c.dly, ease: "easeInOut" } : { duration: 0.3 }}
        />
      ))}
    </div>
  )
}

// ── Ripple Button ──────────────────────────────────────────────────────────────
function RippleButton({ children, className, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const id = Date.now()
    setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 700)
    onClick?.(e)
  }
  return (
    <button className={`relative overflow-hidden ${className}`} onClick={handleClick} {...props}>
      {children}
      {ripples.map(r => (
        <motion.span key={r.id}
          className="absolute rounded-full bg-white/25 pointer-events-none"
          style={{ left: r.x, top: r.y, width: 8, height: 8, x: -4, y: -4 }}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 20, opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}
    </button>
  )
}

// ── Custom Cursor ──────────────────────────────────────────────────────────────
function CustomCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 })
  const [variant, setVariant] = useState<"default" | "button" | "card">("default")
  const [clicked, setClicked] = useState(false)

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.closest("button, a, [role='button']")) setVariant("button")
      else if (t.closest("[data-card]")) setVariant("card")
      else setVariant("default")
    }
    const down = () => setClicked(true)
    const up = () => setClicked(false)
    window.addEventListener("mousemove", move)
    document.addEventListener("mouseover", over)
    window.addEventListener("mousedown", down)
    window.addEventListener("mouseup", up)
    return () => {
      window.removeEventListener("mousemove", move)
      document.removeEventListener("mouseover", over)
      window.removeEventListener("mousedown", down)
      window.removeEventListener("mouseup", up)
    }
  }, [])

  const ringSize = variant === "button" ? 48 : variant === "card" ? 56 : 30
  return (
    <>
      <motion.div className="fixed top-0 left-0 w-2 h-2 rounded-full bg-violet-400 pointer-events-none z-[9999] hidden lg:block"
        animate={{ x: pos.x - 4, y: pos.y - 4, scale: clicked ? 0.3 : 1 }}
        transition={{ type: "spring", stiffness: 800, damping: 35 }} />
      <motion.div className="fixed top-0 left-0 rounded-full border border-violet-400/50 pointer-events-none z-[9999] hidden lg:flex items-center justify-center"
        animate={{ x: pos.x - ringSize / 2, y: pos.y - ringSize / 2, width: ringSize, height: ringSize, opacity: variant === "default" ? 0.4 : 0.85, scale: clicked ? 0.75 : 1, backgroundColor: variant === "button" ? "rgba(124,58,237,0.1)" : "transparent" }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}>
        {variant === "card" && <span className="text-violet-400 text-[9px] font-bold tracking-wide">PLAY</span>}
      </motion.div>
    </>
  )
}

// ── Loading Screen ─────────────────────────────────────────────────────────────
function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setProgress(p => {
      if (p >= 100) { clearInterval(t); setTimeout(onDone, 300); return 100 }
      return p + (p < 70 ? 3 : p < 90 ? 1.5 : 0.8)
    }), 30)
    return () => clearInterval(t)
  }, [onDone])
  return (
    <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center gap-8">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-2xl shadow-violet-600/40">
          <Mic2 size={28} className="text-white" />
        </div>
        <div className="font-display text-2xl font-bold">Abdul <span className="text-violet-400">&amp;</span> Faizan</div>
      </motion.div>
      <div className="w-48 h-px bg-border rounded-full overflow-hidden">
        <motion.div className="h-full bg-violet-500 rounded-full" style={{ width: `${progress}%` }} />
      </div>
      <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 1.6 }}
        className="text-xs text-muted-foreground tracking-widest uppercase">Loading</motion.div>
    </motion.div>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar({ dark, onToggleDark, active, onNav }: {
  dark: boolean; onToggleDark: () => void; active: string; onNav: (s: string) => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  const links = ["Home", "Episodes", "About", "Categories", "Contact"]
  return (
    <motion.nav initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "backdrop-blur-2xl bg-background/80 border-b border-border shadow-xl shadow-black/5" : ""}`}>
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <button onClick={() => onNav("home")} className="flex items-center gap-2.5 group">
          <motion.div whileHover={{ scale: 1.08, rotate: 5 }} whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/40">
            <Mic2 size={15} className="text-white" />
          </motion.div>
          <span className="font-display font-bold text-base tracking-tight">
            Abdul <span className="text-violet-400">&amp;</span> Faizan
          </span>
        </button>

        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <button key={l} onClick={() => onNav(l.toLowerCase())}
              className={`text-sm transition-colors relative group pb-0.5 ${active === l.toLowerCase() ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {l}
              <span className={`absolute bottom-0 left-0 h-px bg-violet-500 transition-all duration-300 ${active === l.toLowerCase() ? "w-full" : "w-0 group-hover:w-full"}`} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onToggleDark}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <AnimatePresence mode="wait">
              <motion.div key={dark ? "sun" : "moon"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                {dark ? <Sun size={15} /> : <Moon size={15} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
          <RippleButton onClick={() => window.open(`https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`, "_blank", "noopener")}
            className="hidden md:flex items-center gap-1.5 px-4 h-9 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-600/30 active:scale-95">
            Subscribe
          </RippleButton>
          <button onClick={() => setOpen(!open)} className="md:hidden w-9 h-9 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div key={open ? "x" : "menu"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                {open ? <X size={18} /> : <Menu size={18} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-background/97 backdrop-blur-2xl border-b border-border">
            <div className="px-5 py-5 flex flex-col gap-1">
              {[...links, "Subscribe"].map((l, i) => (
                <motion.button key={l} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    if (l === "Subscribe") {
                      window.open(`https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`, "_blank", "noopener")
                      setOpen(false)
                    } else {
                      onNav(l.toLowerCase())
                      setOpen(false)
                    }
                  }}
                  className={`text-sm py-3 text-left font-medium ${l === "Subscribe" ? "text-violet-400" : "text-muted-foreground"}`}>
                  {l}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────────
function HeroSection({ episodes, onNav, onPlay, playingId, channelStats }: {
  episodes: Episode[]; onNav: (s: string) => void; onPlay: (id: string | number) => void; playingId: string | number | null; channelStats: YouTubeChannelStatistics | null
}) {
  const featured = episodes[0]
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section id="home" ref={containerRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Parallax bg */}
      <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-background" />
      </motion.div>

      {/* Animated gradient blobs */}
      <motion.div className="absolute top-1/4 -left-64 w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none"
        animate={{ x: [0, 80, 0], y: [0, -60, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 22, ease: "easeInOut" }} />
      <motion.div className="absolute bottom-0 -right-64 w-[600px] h-[600px] rounded-full bg-orange-500/8 blur-[130px] pointer-events-none"
        animate={{ x: [0, -70, 0], y: [0, 70, 0] }} transition={{ repeat: Infinity, duration: 28, ease: "easeInOut" }} />
      <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-violet-900/12 blur-[150px] pointer-events-none"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }} />

      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div key={i}
            className="absolute w-1 h-1 rounded-full bg-violet-400/15"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 61) % 100}%` }}
            animate={{ y: [-10, 10, -10], opacity: [0.1, 0.4, 0.1], scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 3 + (i % 5), delay: (i * 0.25) % 4, ease: "easeInOut" }}
          />
        ))}
      </div>

      <motion.div style={{ opacity }} className="relative max-w-7xl mx-auto px-5 py-20 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center w-full">
        {/* Left */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.2 }}
            onClick={() => featured && (featured.videoId ? window.open(`https://www.youtube.com/watch?v=${featured.videoId}`, "_blank", "noopener") : window.open(`https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`, "_blank", "noopener"))}
            role="button"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-7 tracking-wide cursor-pointer">
            <div className="relative w-4 h-4 flex items-center justify-center">
              <motion.span className="absolute rounded-full bg-violet-400/40"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }} />
              <motion.span className="relative w-2.5 h-2.5 rounded-full bg-violet-400"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} />
            </div>
            <span className="ml-1">{featured ? `NEW · Episode ${featured.num} just dropped` : "NEW · Episode just dropped"}</span>
          </motion.div>

          <div className="overflow-hidden mb-6">
            <motion.h1 initial={{ y: 80 }} animate={{ y: 0 }} transition={{ duration: 0.75, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[clamp(3.8rem,9vw,7rem)] font-bold leading-[0.9] tracking-tight">
              Abdul
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                &amp; Faizan
              </span>
            </motion.h1>
          </div>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.38 }}
            className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md">
          Politics • Geopolitics • Business
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.48 }}
            className="flex flex-wrap gap-3 mb-10">
            <RippleButton onClick={() => window.open(`https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`, "_blank", "noopener")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all hover:scale-105 hover:shadow-2xl hover:shadow-violet-600/40 active:scale-95 text-sm">
              <Play size={15} fill="currentColor" /> Watch Now
            </RippleButton>
            <RippleButton onClick={() => onNav("episodes")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full border border-border hover:border-violet-500/50 hover:bg-violet-500/5 font-semibold transition-all text-sm">
              All Episodes <ArrowRight size={14} />
            </RippleButton>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex items-center flex-wrap gap-5">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Watch on</span>
            <motion.a href="https://www.facebook.com/share/1FGcR2cGGg/" target="_blank" rel="noreferrer" whileHover={{ scale: 1.05, color: "#a78bfa" }}
              className="text-xs text-muted-foreground hover:text-violet-400 cursor-pointer transition-colors font-semibold">
              Facebook
            </motion.a>
            <motion.a href="https://www.instagram.com/abdulxfaizan?igsh=MTlhM2hjZG1scDZoag==" target="_blank" rel="noreferrer" whileHover={{ scale: 1.05, color: "#a78bfa" }}
              className="text-xs text-muted-foreground hover:text-violet-400 cursor-pointer transition-colors font-semibold">
              Instagram
            </motion.a>
            <motion.a href="https://www.youtube.com/@alhur_network" target="_blank" rel="noreferrer" whileHover={{ scale: 1.05, color: "#a78bfa" }}
              className="text-xs text-muted-foreground hover:text-violet-400 cursor-pointer transition-colors font-semibold">
              YouTube
            </motion.a>
          </motion.div>
        </div>

        {/* Right: 3D card */}
        <FeaturedCard ep={featured} playingId={playingId} onPlay={onPlay} channelStats={channelStats} />
      </motion.div>
    </section>
  )
}

function FeaturedCard({ ep, playingId, onPlay, channelStats }: { ep: Episode; playingId: string | number | null; onPlay: (id: string | number) => void; channelStats: YouTubeChannelStatistics | null }) {
  const { ref, tilt, onMove, onLeave } = useTilt()
  return (
    <motion.div ref={ref} data-card onMouseMove={onMove} onMouseLeave={onLeave}
      initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transformStyle: "preserve-3d" }}
      className="relative will-change-transform">
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-card/60 backdrop-blur-xl p-1 shadow-2xl shadow-black/40">
        {/* Glare overlay */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
          <div className="absolute w-64 h-64 rounded-full bg-white/8 blur-3xl -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
            style={{ left: `${tilt.glare.x}%`, top: `${tilt.glare.y}%` }} />
        </div>
        <div className="rounded-xl overflow-hidden">
          <div className="relative overflow-hidden">
            <img src={ep.thumbnailUrl ?? `https://images.unsplash.com/photo-${ep.photo}?w=700&h=380&fit=crop&auto=format&q=85`}
              alt={ep.title} className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="text-xs bg-violet-600/90 text-white px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">LATEST · EP. {ep.num}</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <div className="text-xs text-violet-300 font-semibold mb-1">{ep.category}</div>
                <div className="text-white font-display font-bold text-lg leading-tight line-clamp-2 max-w-xs">{ep.title}</div>
              </div>
              <motion.button onClick={() => onPlay(ep.id)} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 ml-3 shadow-xl"
                style={{ backgroundColor: ep.color, boxShadow: `0 8px 30px ${ep.color}60` }}>
                {playingId === ep.id ? <Pause size={16} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              </motion.button>
            </div>
          </div>
          <div className="p-4 bg-card">
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{ep.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock size={11} />{ep.duration} <span className="text-border">·</span> {ep.date}
              </div>
              <div className={`transition-opacity duration-300 ${playingId === ep.id ? "opacity-100" : "opacity-25"}`}
                style={{ color: ep.color }}>
                <WaveformBars playing={playingId === ep.id} bars={16} color={ep.color} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
        className="absolute -bottom-5 -left-6 hidden lg:flex items-center gap-3 bg-card/90 backdrop-blur-xl border border-border rounded-xl px-4 py-3 shadow-2xl"
        style={{ transform: "translateZ(30px)" }}>
        <div className="w-8 h-8 rounded-full bg-violet-600/15 flex items-center justify-center">
          <Headphones size={14} className="text-violet-400" />
        </div>
        <div>
          <div className="text-xs font-bold">{channelStats ? `${formatLargeNumber(channelStats.viewCount)} views` : "380K listeners"}</div>
          <div className="text-xs text-muted-foreground">channel total</div>
        </div>
      </motion.div>

      <motion.div animate={{ y: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
        className="absolute -top-4 -right-4 hidden lg:flex items-center gap-2 bg-card/90 backdrop-blur-xl border border-border rounded-xl px-3 py-2.5 shadow-2xl"
        style={{ transform: "translateZ(20px)" }}>
        <Zap size={13} className="text-amber-400" />
        <span className="text-xs font-bold">{channelStats ? `${formatLargeNumber(channelStats.subscriberCount)} subs` : "12.4K reviews"}</span>
      </motion.div>
    </motion.div>
  )
}

// ── Stats ──────────────────────────────────────────────────────────────────────
function StatsSection({ channelStats, episodeCount }: { channelStats: YouTubeChannelStatistics | null; episodeCount: number }) {
  const { ref, inView } = useInView()
  const stats = channelStats ? [
    { label: "Channel views", value: Number(channelStats.viewCount), suffix: "", icon: Headphones },
    { label: "Subscribers", value: Number(channelStats.subscriberCount), suffix: "", icon: Star },
    { label: "Videos", value: Number(channelStats.videoCount), suffix: "", icon: Globe },
    { label: "Episodes", value: episodeCount, suffix: "", icon: Mic2 },
  ] : STATS

  return (
    <section ref={ref} className="py-16 relative overflow-hidden border-y border-border">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/4 via-transparent to-orange-500/4 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((s, i) => {
            const val = useCounter(s.value, inView, 1800 + i * 100)
            const Icon = s.icon
            return (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                className="text-center group">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/15 mb-3 group-hover:bg-violet-600/20 transition-colors">
                  <Icon size={16} className="text-violet-400" />
                </div>
                <div className="font-display text-4xl md:text-5xl font-bold tabular-nums leading-none mb-1">
                  {formatLargeNumber(val)}<span className="text-violet-400">{s.suffix}</span>
                </div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Horizontal Episode Carousel ────────────────────────────────────────────────
function EpisodeCarousel({ episodes, loading, playingId, onPlay, onViewEp }: {
  episodes: Episode[]; loading: boolean; playingId: string | number | null; onPlay: (id: string | number) => void; onViewEp: (ep: Episode) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)
  const { ref, inView } = useInView()

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === "right" ? 340 : -340, behavior: "smooth" })
  }
  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 0)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  return (
    <div ref={ref} className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 mb-8 flex items-end justify-between">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <div className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Latest Videos</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold">Fresh from YouTube</h2>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
          className="hidden md:flex gap-2">
          <button onClick={() => scroll("left")} disabled={!canLeft}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${canLeft ? "border-border hover:border-violet-500/50 hover:bg-violet-500/5" : "border-border/30 opacity-30"}`}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll("right")} disabled={!canRight}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${canRight ? "border-border hover:border-violet-500/50 hover:bg-violet-500/5" : "border-border/30 opacity-30"}`}>
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>

      <div ref={scrollRef} onScroll={checkScroll}
        className="flex gap-5 overflow-x-auto pl-5 pr-10 pb-4 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {episodes.map((ep, i) => (
          <motion.div key={ep.id} data-card
            initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.07 }}
            className="flex-none w-72 group rounded-2xl overflow-hidden border border-border/60 bg-card hover:border-violet-500/30 transition-all duration-300 cursor-default"
            whileHover={{ y: -8, boxShadow: `0 24px 60px -12px ${ep.color}30` }}>
            <div className="relative overflow-hidden h-44">
              <img src={ep.thumbnailUrl ?? `https://images.unsplash.com/photo-${ep.photo}?w=400&h=240&fit=crop&auto=format&q=75`}
                alt={ep.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at 50% 120%, ${ep.color}30 0%, transparent 70%)` }} />
              <span className="absolute top-3 left-3 text-xs font-bold bg-black/50 backdrop-blur-sm text-white/90 px-2.5 py-1 rounded-full">Ep. {ep.num}</span>
              <motion.button onClick={() => onPlay(ep.id)} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
                className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl"
                style={{ backgroundColor: ep.color }}>
                {playingId === ep.id ? <Pause size={13} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
              </motion.button>
              {playingId === ep.id && (
                <div className="absolute bottom-4 left-3" style={{ color: ep.color }}>
                  <WaveformBars playing bars={10} color={ep.color} />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold" style={{ color: ep.color }}>{ep.category}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={9} />{ep.duration}</span>
              </div>
              <button onClick={() => onViewEp(ep)} className="text-left w-full">
                <h3 className="font-display font-bold text-sm leading-snug mb-2 hover:text-violet-400 transition-colors line-clamp-2">{ep.title}</h3>
              </button>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{ep.date}</span>
                <button onClick={() => onViewEp(ep)} className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">Details →</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── Episodes Grid ──────────────────────────────────────────────────────────────
function EpisodesSection({ episodes, loading, playingId, onPlay, onViewEp }: {
  episodes: Episode[]; loading: boolean; playingId: string | number | null; onPlay: (id: string | number) => void; onViewEp: (ep: Episode) => void
}) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [sort, setSort] = useState<"newest" | "oldest" | "shortest" | "longest">("newest")
  const { ref, inView } = useInView()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = episodes.filter(ep => {
      const matchQ = !search || ep.title.toLowerCase().includes(q) || ep.description.toLowerCase().includes(q) || ep.guests.some(g => g.toLowerCase().includes(q))
      const matchC = category === "All" || ep.category === category
      return matchQ && matchC
    })
    if (sort === "oldest") list = [...list].reverse()
    if (sort === "shortest") list = [...list].sort((a, b) => a.duration.localeCompare(b.duration))
    if (sort === "longest") list = [...list].sort((a, b) => b.duration.localeCompare(a.duration))
    return list
  }, [episodes, search, category, sort])

  return (
    <section id="episodes" ref={ref} className="py-24 border-t border-border">
      <div className="max-w-7xl mx-auto px-5">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-10">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-3">All Episodes</h2>
          <p className="text-muted-foreground text-lg">142 episodes and counting. New every Sunday.</p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search episodes, guests…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 h-11 rounded-xl bg-muted border border-border text-sm outline-none focus:border-violet-500/60 transition-colors" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-muted-foreground hover:text-foreground transition-colors" /></button>}
          </div>
          <div className="flex gap-2 flex-wrap flex-1">
            {CATEGORIES.map(c => (
              <motion.button key={c} onClick={() => setCategory(c)} whileTap={{ scale: 0.95 }}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${category === c ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {c}
              </motion.button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="h-11 px-4 rounded-xl bg-muted border border-border text-sm outline-none focus:border-violet-500/60 transition-colors cursor-pointer text-muted-foreground">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="shortest">Shortest first</option>
            <option value="longest">Longest first</option>
          </select>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={`placeholder-${i}`} className="h-96 rounded-2xl bg-muted/60 animate-pulse" />
        )) : filtered.length > 0 ? filtered.map((ep, i) => (
              <motion.div key={ep.id} data-card layout
                initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group rounded-2xl overflow-hidden border border-border/60 bg-card hover:border-violet-500/30 transition-all duration-300"
                whileHover={{ y: -6, boxShadow: `0 20px 50px -15px ${ep.color}25` }}>
                <div className="relative overflow-hidden aspect-video">
                  <img src={ep.thumbnailUrl ?? `https://images.unsplash.com/photo-${ep.photo}?w=500&h=280&fit=crop&auto=format&q=75`}
                    alt={ep.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                    style={{ background: `radial-gradient(circle at 50% 100%, ${ep.color}25 0%, transparent 60%)` }} />
                  <span className="absolute top-3 left-3 text-xs font-bold bg-black/50 backdrop-blur-sm text-white/90 px-2.5 py-1 rounded-full">Ep. {ep.num}</span>
                  <motion.button onClick={() => onPlay(ep.id)} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl"
                    style={{ backgroundColor: ep.color }}>
                    {playingId === ep.id ? <Pause size={13} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                  </motion.button>
                  {playingId === ep.id && <div className="absolute bottom-4 left-3" style={{ color: ep.color }}><WaveformBars playing bars={12} color={ep.color} /></div>}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold" style={{ color: ep.color }}>{ep.category}</span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={9} />{ep.duration}</span>
                  </div>
                  <button onClick={() => onViewEp(ep)} className="text-left w-full group/title">
                    <h3 className="font-display font-bold text-base leading-snug mb-2 group-hover/title:text-violet-400 transition-colors line-clamp-2">{ep.title}</h3>
                  </button>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{ep.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{ep.date}</span>
                    <div className="flex gap-1">{ep.guests.slice(0, 1).map(g => <span key={g} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground truncate max-w-[100px]">{g}</span>)}</div>
                  </div>
                </div>
              </motion.div>
            )) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3 py-20 text-center text-muted-foreground">
                No episodes matched your search.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

// ── About ──────────────────────────────────────────────────────────────────────
function AboutSection({ channelStats, episodeCount }: { channelStats: YouTubeChannelStatistics | null; episodeCount: number }) {
  const { ref, inView } = useInView()
  const totalViews = channelStats ? formatLargeNumber(channelStats.viewCount) : "380K+"
  const countries = 8
  const episodes = episodeCount
  const founded = 2026
  return (
    <section id="about" ref={ref} className="py-24 bg-muted/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/6 blur-[120px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.75 }}>
            <div className="text-xs text-violet-400 font-bold uppercase tracking-widest mb-4">About the show</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-[1.05]">
              We dig until we find<br /><span className="text-violet-400">the real story.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-5">
              Founded in 2026, our podcast is committed to delivering accurate, well-researched, and unbiased discussions on politics, corruption, governance, and current affairs. Every episode is backed by credible sources and factual reporting, with a mission to inform the public, promote accountability, and encourage informed conversations.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {[[totalViews, "Total viewers"], [String(countries), "Countries"], [String(episodes), "Episodes"], [String(founded), "Founded"]].map(([n, l]) => (
                <div key={l} className="rounded-xl bg-muted/50 border border-border/50 p-4">
                  <div className="font-display text-2xl font-bold text-violet-400">{n}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.75, delay: 0.12 }} className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
              <img src={studioImage} loading="lazy"
                alt="Podcast recording studio" className="w-full object-cover" />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/8" />
            </div>
            <motion.div animate={{ y: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
              className="absolute -bottom-5 -right-5 bg-card/90 backdrop-blur-xl border border-border rounded-xl p-3.5 shadow-2xl flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold">AbdulxFaizan</div>
                
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ── Testimonials ───────────────────────────────────────────────────────────────
function TestimonialsSection({ comments, loadingComments, commentsError, showAllComments, onToggleShowAll }: { comments: YouTubeComment[]; loadingComments: boolean; commentsError: string | null; showAllComments: boolean; onToggleShowAll: () => void }) {
  const { ref, inView } = useInView()
  const [active, setActive] = useState<number | null>(null)
  const maxVisible = showAllComments ? comments.length : 4
  const visibleComments = comments.slice(0, maxVisible)
  return (
    <section ref={ref} className="py-24 bg-muted/20 overflow-hidden relative">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-violet-600/6 blur-[100px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-5">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-12 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-3">Latest YouTube Comments</h2>
          <p className="text-muted-foreground">Live reactions from the latest video, with a see more option.</p>
        </motion.div>
        {loadingComments ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
            Fetching the latest comments from YouTube...
          </div>
        ) : commentsError ? (
          <div className="rounded-3xl border border-rose-500 bg-rose-500/10 p-12 text-center text-rose-900 dark:text-rose-100">
            <div className="font-semibold mb-2">Unable to load comments.</div>
            <div className="text-sm text-foreground/80">{commentsError}</div>
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
            No comments were found for the latest YouTube video.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {visibleComments.map((t, i) => (
                <motion.div key={t.id}
                  initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, delay: i * 0.09 }}
                  whileHover={{ y: -6 }}
                  className={`rounded-2xl border bg-card p-5 cursor-default transition-all duration-300 ${active === i ? "border-violet-500/50 shadow-xl shadow-violet-600/10" : "border-border/60 hover:border-violet-500/25"}`}
                  onClick={() => setActive(i)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-muted-foreground">{new Date(t.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">YouTube</span>
                  </div>
                  <p className="text-sm leading-relaxed mb-4 text-foreground/85" dangerouslySetInnerHTML={{ __html: t.textDisplay }} />
                  <div className="flex items-center gap-2.5">
                    <img src={t.authorProfileImageUrl}
                      alt={t.authorDisplayName} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <div className="text-xs font-bold">{t.authorDisplayName}</div>
                      <div className="text-xs text-muted-foreground">{t.likeCount} likes</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {comments.length > 4 && (
              <div className="mt-8 text-center">
                <button onClick={onToggleShowAll}
                  className="inline-flex items-center justify-center rounded-full border border-violet-500 px-5 py-2.5 text-sm font-semibold text-violet-400 hover:bg-violet-500/10 transition-colors">
                  {showAllComments ? "Show fewer comments" : `See ${comments.length - 4} more comments`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

// ── Sponsors ───────────────────────────────────────────────────────────────────
function SponsorsSection() {
  const { ref, inView } = useInView()
  return (
    <section ref={ref} className="py-16 border-y border-border">
      <div className="max-w-7xl mx-auto px-5 text-center">
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} className="text-xs text-muted-foreground uppercase tracking-widest mb-8">Sponsored By </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {SPONSORS.map((s, i) => (
            <motion.div key={s}
              initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.07 }}
              whileHover={{ scale: 1.08, opacity: 0.7 }}
              className="font-display text-xl font-bold text-muted-foreground/30 transition-all cursor-pointer select-none">{s}</motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FAQ ────────────────────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const { ref, inView } = useInView()
  return (
    <section ref={ref} className="py-24 bg-muted/20">
      <div className="max-w-3xl mx-auto px-5">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-12 text-center">
          <h2 className="font-display text-4xl font-bold mb-3">Frequently Asked</h2>
          <p className="text-muted-foreground">The questions we get the most.</p>
        </motion.div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.06 }}
              className={`rounded-xl border bg-card overflow-hidden transition-all duration-300 ${open === i ? "border-violet-500/40 shadow-md shadow-violet-600/8" : "border-border/60"}`}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 group">
                <span className="font-semibold text-sm leading-relaxed group-hover:text-violet-400 transition-colors">{faq.q}</span>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.22 }} className="flex-shrink-0">
                  <ChevronDown size={16} className="text-muted-foreground" />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }} className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Contact ────────────────────────────────────────────────────────────────────
function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { ref, inView } = useInView()
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      //  FormSubmit first (no account required)
      const endpoint = "https://formsubmit.co/alhurwear@gmail.com"
      const fd = new FormData()
      fd.append("name", form.name)
      fd.append("email", form.email)
      fd.append("subject", form.subject)
      fd.append("message", form.message)
      fd.append("_subject", `Website Contact: ${form.subject || "New message"}`)
      // disable captcha
      fd.append("_captcha", "false")

      const res = await fetch(endpoint, { method: "POST", body: fd })
      if (!res.ok && !res.redirected) throw new Error("Form submit failed")
      setSent(true)
      setForm({ name: "", email: "", subject: "", message: "" })
    } catch (err) {
      // Fallback: open mail client with prefilled mailto (user must send manually)
      try {
        const body = encodeURIComponent(`Name: ${form.name}%0AEmail: ${form.email}%0A%0A${form.message}`)
        const subject = encodeURIComponent(form.subject || "Website message")
        window.location.href = `mailto:alhurwear@gmail.com?subject=${subject}&body=${body}`
        setSent(true)
      } catch (err2) {
        setError("Unable to send message. Please email alhurwear@gmail.com directly.")
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="contact" ref={ref} className="py-24">
      <div className="max-w-2xl mx-auto px-5">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-12 text-center">
          <h2 className="font-display text-4xl font-bold mb-3">Get in touch</h2>
          <p className="text-muted-foreground">Guest pitches, sponsorship inquiries, or just to say hello.</p>
        </motion.div>
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
                <Check size={24} className="text-violet-400" />
              </div>
              <p className="font-display font-bold text-xl mb-1">Message received</p>
              <p className="text-sm text-muted-foreground">We'll reply within 2 business days.</p>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit}
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.1 }}
              className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Name" required value={form.name} onChange={set("name")}
                  className="px-4 h-12 rounded-xl bg-muted border border-border text-sm outline-none focus:border-violet-500/60 transition-colors" />
                <input type="email" placeholder="Email" required value={form.email} onChange={set("email")}
                  className="px-4 h-12 rounded-xl bg-muted border border-border text-sm outline-none focus:border-violet-500/60 transition-colors" />
              </div>
              <select value={form.subject} onChange={set("subject")} required
                className="w-full px-4 h-12 rounded-xl bg-muted border border-border text-sm outline-none focus:border-violet-500/60 transition-colors cursor-pointer text-muted-foreground appearance-none">
                <option value="">Subject</option>
                <option>Guest suggestion</option>
                <option>Sponsorship inquiry</option>
                <option>Press / media</option>
                <option>General feedback</option>
                <option>Other</option>
              </select>
              <textarea placeholder="Your message" required rows={5} value={form.message} onChange={set("message")}
                className="w-full px-4 py-3.5 rounded-xl bg-muted border border-border text-sm outline-none focus:border-violet-500/60 transition-colors resize-none" />
              {error && <div className="text-sm text-rose-500">{error}</div>}
              <RippleButton type="submit" disabled={sending}
                className={`w-full h-12 rounded-xl ${sending ? "bg-violet-500/60" : "bg-violet-600 hover:bg-violet-500"} text-white font-bold transition-all hover:shadow-lg hover:shadow-violet-600/30 active:scale-[0.99]`}>
                {sending ? "Sending..." : "Send Message"}
              </RippleButton>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer({ onNav }: { onNav: (s: string) => void }) {
  return (
    <footer className="border-t border-border bg-muted/10">
      <div className="max-w-7xl mx-auto px-5 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center"><Mic2 size={15} className="text-white" /></div>
              <span className="font-display font-bold">Abdul &amp; Faizan</span>
            </div>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed max-w-xs">Politics • Geopolitics • Business</p>
            <div className="flex gap-2">
              {[
                { Icon: Facebook, href: "https://www.facebook.com/share/1FGcR2cGGg/" },
                { Icon: Instagram, href: "https://www.instagram.com/abdulxfaizan?igsh=MTlhM2hjZG1scDZoag==" },
                { Icon: Youtube, href: "https://www.youtube.com/@alhur_network" },
              ].map(({ Icon, href }, i) => (
                <motion.a key={i} href={href} target="_blank" rel="noreferrer" whileHover={{ scale: 1.15, y: -2 }}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-violet-600/20 hover:text-violet-400 flex items-center justify-center transition-colors">
                  <Icon size={13} />
                </motion.a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-muted-foreground">Podcast</h4>
            <div className="flex flex-col gap-2.5">
              {["Episodes", "Hosts", "About", "Contact"].map(l => (
                <button key={l} onClick={() => onNav(l.toLowerCase())}
                  className="text-sm text-muted-foreground hover:text-foreground text-left transition-colors">{l}</button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-muted-foreground">Watch On</h4>
            <div className="flex flex-col gap-2.5">
              <a href="https://www.facebook.com/share/1FGcR2cGGg/" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors group">
                <ExternalLink size={11} className="group-hover:text-violet-400 transition-colors" /> Facebook
              </a>
              <a href="https://www.instagram.com/abdulxfaizan?igsh=MTlhM2hjZG1scDZoag==" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors group">
                <ExternalLink size={11} className="group-hover:text-violet-400 transition-colors" /> Instagram
              </a>
              <a href="https://www.youtube.com/@alhur_network" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors group">
                <ExternalLink size={11} className="group-hover:text-violet-400 transition-colors" /> YouTube
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-muted-foreground">Legal</h4>
            <div className="flex flex-col gap-2.5">
              {["Privacy Policy", "Terms of Use", "Cookie Policy"].map(l => (
                <a key={l} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© 2026 abdulxfaizan &amp; Noise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// ── Media Player ──────────────────────────────────────────────────────────────
function AudioPlayer({ ep, onClose, onPlayPause, isPlaying }: {
  ep: Episode; onClose: () => void; onPlayPause: () => void; isPlaying: boolean
}) {
  const [progress, setProgress] = useState(22)
  const [volume, setVolume] = useState(75)
  const videoSrc = ep.videoId ? `https://www.youtube.com/embed/${ep.videoId}?autoplay=${isPlaying ? "1" : "0"}&rel=0&controls=1` : null

  return (
    <motion.div initial={{ y: 96 }} animate={{ y: 0 }} exit={{ y: 96 }} transition={{ type: "spring", damping: 30, stiffness: 400 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-2xl shadow-2xl shadow-black/20">
      {videoSrc ? (
        <div className="max-w-7xl mx-auto px-5 py-4 flex flex-col md:flex-row items-start gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <img src={ep.thumbnailUrl ?? `https://images.unsplash.com/photo-${ep.photo}?w=80&h=80&fit=crop&auto=format`}
              alt={ep.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-md" />
            <div className="min-w-0">
              <div className="text-sm font-bold truncate max-w-[220px]">{ep.title}</div>
              <div className="text-xs text-muted-foreground">Ep. {ep.num} · {ep.category}</div>
            </div>
          </div>

          <div className="w-full rounded-3xl overflow-hidden border border-border bg-black/80 shadow-inner" style={{ minHeight: 0 }}>
            <iframe src={videoSrc} title={ep.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
              className="w-full h-56 md:h-44 lg:h-48" />
          </div>

          <div className="flex items-center gap-3 self-stretch">
            <motion.button whileTap={{ scale: 0.88 }} onClick={onPlayPause}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0"
              style={{ backgroundColor: ep.color, boxShadow: `0 4px 20px ${ep.color}60` }}>
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </motion.button>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-muted/70 hover:bg-muted">
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="h-0.5 bg-muted">
            <motion.div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: ep.color }} />
          </div>
          <div className="max-w-7xl mx-auto px-5 h-16 flex items-center gap-4">
            <img src={`https://images.unsplash.com/photo-${ep.photo}?w=80&h=80&fit=crop&auto=format`}
              alt={ep.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-md" />
            <div className="flex-1 min-w-0 hidden sm:block">
              <div className="text-sm font-bold truncate">{ep.title}</div>
              <div className="text-xs text-muted-foreground">Ep. {ep.num} · {ep.category}</div>
            </div>
            <div className="hidden md:flex flex-shrink-0" style={{ color: ep.color }}>
              <WaveformBars playing={isPlaying} bars={14} color={ep.color} />
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><SkipBack size={14} /></button>
              <motion.button whileTap={{ scale: 0.88 }} onClick={onPlayPause}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0"
                style={{ backgroundColor: ep.color, boxShadow: `0 4px 20px ${ep.color}60` }}>
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
              </motion.button>
              <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><SkipForward size={14} /></button>
            </div>
            <div className="hidden md:flex items-center gap-2 w-44 flex-shrink-0">
              <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{String(Math.floor(progress * 0.58)).padStart(2, "0")}:00</span>
              <div className="flex-1 h-1 bg-muted rounded-full cursor-pointer"
                onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setProgress(((e.clientX - r.left) / r.width) * 100) }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: ep.color }} />
              </div>
              <span className="text-xs text-muted-foreground w-8 tabular-nums">58:32</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <Volume2 size={13} className="text-muted-foreground" />
              <div className="w-20 h-1 bg-muted rounded-full cursor-pointer"
                onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setVolume(((e.clientX - r.left) / r.width) * 100) }}>
                <div className="h-full bg-muted-foreground/60 rounded-full" style={{ width: `${volume}%` }} />
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 rounded-full hover:bg-muted">
              <X size={15} />
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}

// ── Episode Modal ──────────────────────────────────────────────────────────────
function EpisodeModal({ episodes, ep, playing, onTogglePlay, onClose }: {
  episodes: Episode[]; ep: Episode; playing: boolean; onTogglePlay: () => void; onClose: () => void
}) {
  const related = episodes.filter((e: Episode) => e.id !== ep.id && e.category === ep.category).slice(0, 3)
  const nonCatRelated = episodes.filter((e: Episode) => e.id !== ep.id && e.category !== ep.category).slice(0, 3 - related.length)
  const relatedEps = [...related, ...nonCatRelated]

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", h)
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", h) }
  }, [onClose])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="bg-background border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        style={{ scrollbarWidth: "none" }} onClick={e => e.stopPropagation()}>

        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-background/92 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ep.color }} />
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: ep.color }}>Ep. {ep.num}</span>
            <span className="text-xs text-muted-foreground">· {ep.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors"><Bookmark size={13} /></button>
            <button className="w-8 h-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors"><Share2 size={13} /></button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors"><X size={15} /></button>
          </div>
        </div>

        <div className="p-6">
          {/* Cover image */}
          <div className="rounded-2xl overflow-hidden mb-6 shadow-xl relative">
            <img src={`https://images.unsplash.com/photo-${ep.photo}?w=800&h=360&fit=crop&auto=format&q=85`}
              alt={ep.title} className="w-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${ep.color}20, transparent)` }} />
          </div>

          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 leading-tight">{ep.title}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock size={13} />{ep.duration}</span>
            <span>{ep.date}</span>
            <span className="font-medium" style={{ color: ep.color }}>{ep.category}</span>
            <span>Guests: {ep.guests.join(", ")}</span>
          </div>

          {/* In-modal player */}
          <div className="rounded-2xl border border-border bg-card p-4 mb-7 flex items-center gap-4"
            style={{ borderColor: `${ep.color}30`, background: `linear-gradient(to right, ${ep.color}08, transparent)` }}>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={onTogglePlay}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-lg"
              style={{ backgroundColor: ep.color, boxShadow: `0 8px 30px ${ep.color}50` }}>
              {playing ? <Pause size={17} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            </motion.button>
            <div className="flex-1 min-w-0" style={{ color: ep.color }}>
              <WaveformBars playing={playing} bars={30} color={ep.color} />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="w-9 h-9 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"><Download size={14} /></button>
              <button className="w-9 h-9 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"><Share2 size={14} /></button>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{ep.description}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-7">
            In this episode, we go deep on the implications for software teams, the regulatory landscape, and what the next five years might look like. We also discuss what's consistently absent from mainstream coverage — and why that gap exists.
          </p>

          {/* Timestamps */}
          <h4 className="font-display font-bold mb-3 flex items-center gap-2">
            <TrendingUp size={15} className="text-violet-400" /> Timestamps
          </h4>
          <div className="rounded-xl bg-muted/40 p-4 space-y-2 mb-7">
            {[["00:00", "Introduction & context"], ["04:15", "Guest background"], ["16:40", "Core argument"], ["38:20", "Listener questions"], ["52:00", "Wrap-up & links"]].map(([t, l]) => (
              <div key={t} className="flex items-center gap-3 text-sm group cursor-pointer">
                <span className="font-mono text-xs px-2 py-0.5 rounded-md font-bold group-hover:text-white transition-colors" style={{ backgroundColor: `${ep.color}20`, color: ep.color }}>{t}</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">{l}</span>
              </div>
            ))}
          </div>

          {/* Guest info */}
          <h4 className="font-display font-bold mb-3">Guests</h4>
          <div className="flex flex-wrap gap-2 mb-7">
            {ep.guests.map(g => (
              <div key={g} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/30">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ep.color }}>
                  {g[0]}
                </div>
                <span className="text-sm font-semibold">{g}</span>
              </div>
            ))}
          </div>

          {/* Transcript excerpt */}
          <h4 className="font-display font-bold mb-3">Transcript Excerpt</h4>
          <div className="rounded-xl border border-border bg-muted/20 p-4 mb-7 text-sm text-muted-foreground leading-relaxed space-y-3">
            <p><span className="font-bold text-foreground">Maya:</span> "I think the part that gets missed is that this isn't really a technical problem — it never was. It's a coordination problem wearing a technical costume."</p>
            <p><span className="font-bold text-foreground">James:</span> "And that's the thing about coordination problems — they're almost impossible to solve from inside the system that's producing them."</p>
            <p><span className="font-bold text-foreground">Dr. Priya Mehta:</span> "Exactly. Which is why every proposed solution that comes from inside the industry is structurally doomed to be insufficient."</p>
          </div>

          {/* Related */}
          {relatedEps.length > 0 && (
            <>
              <h4 className="font-display font-bold mb-3">More Episodes</h4>
              <div className="space-y-2.5">
                {relatedEps.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-violet-500/30 transition-colors cursor-default">
                    <img src={`https://images.unsplash.com/photo-${r.photo}?w=80&h=80&fit=crop&auto=format`}
                      alt={r.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold line-clamp-1">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.duration} · {r.date}</div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${r.color}15`, color: r.color }}>{r.category}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [dark, setDark] = useState(true)
  const [playingId, setPlayingId] = useState<string | number | null>(null)
  const [playerPaused, setPlayerPaused] = useState(false)
  const [active, setActive] = useState("home")
  const [viewingEp, setViewingEp] = useState<Episode | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>(EPISODES)
  const [channelStats, setChannelStats] = useState<YouTubeChannelStatistics | null>(null)
  const [comments, setComments] = useState<YouTubeComment[]>([])
  const [showAllComments, setShowAllComments] = useState(false)
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [loadingComments, setLoadingComments] = useState(true)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  useEffect(() => {
    let cancelled = false

    async function loadVideos() {
      try {
        const [videos, stats] = await Promise.all([
          getLatestYouTubeVideos(YOUTUBE_CHANNEL_ID, 16),
          getYouTubeChannelStatistics(YOUTUBE_CHANNEL_ID),
        ])
        if (cancelled) return

        setChannelStats(stats)
        if (videos.length > 0) {
          setEpisodes(mapYouTubeVideosToEpisodes(videos))
          setLoadingComments(true)
          setCommentsError(null)
          try {
            const comments = await getLatestYouTubeComments(videos[0].id, 8)
            if (!cancelled) setComments(comments)
          } catch (commentError) {
            console.error(commentError)
            if (!cancelled) {
              if (commentError instanceof Error) setCommentsError(commentError.message)
              else setCommentsError("Unable to load YouTube comments.")
            }
          } finally {
            if (!cancelled) setLoadingComments(false)
          }
        } else {
          if (!cancelled) setLoadingComments(false)
        }
      } catch (error) {
        console.error(error)
        if (error instanceof Error) setVideoError(error.message)
        else setVideoError("Unable to load latest videos from YouTube.")
      } finally {
        if (!cancelled) setLoadingVideos(false)
      }
    }

    loadVideos()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!loaded) return
    const ids = ["home", "episodes", "about", "contact"]
    const h = () => {
      for (const id of [...ids].reverse()) {
        const el = document.getElementById(id)
        if (el && window.scrollY >= el.offsetTop - 120) { setActive(id); break }
      }
    }
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [loaded])

  const nav = (section: string) => {
    const el = document.getElementById(section)
    if (el) el.scrollIntoView({ behavior: "smooth" })
    setActive(section)
  }

  const handlePlay = (id: string | number) => {
    if (playingId === id) {
      setPlayerPaused(p => !p)
    } else {
      setPlayingId(id)
      setPlayerPaused(false)
    }
  }

  const currentEp = playingId != null ? episodes.find(e => e.id === playingId) ?? null : null
  const isPlaying = !playerPaused && playingId != null

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <AnimatePresence>
        {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      </AnimatePresence>

      {loaded && (
        <>
          <CustomCursor />
          <Navbar dark={dark} onToggleDark={() => setDark(d => !d)} active={active} onNav={nav} />
          {videoError && (
            <div className="max-w-7xl mx-auto px-5 py-4">
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-900 dark:text-rose-100">
                <div className="font-semibold">Unable to load latest YouTube videos.</div>
                <div className="mt-1">{videoError}</div>
                <div className="mt-2 text-xs text-rose-700 dark:text-rose-200">Create a <code className="rounded px-1 bg-muted/70">.env</code> file with <code className="rounded px-1 bg-muted/70">VITE_YOUTUBE_API_KEY</code> and optionally <code className="rounded px-1 bg-muted/70">VITE_YOUTUBE_CHANNEL_ID</code>.</div>
              </div>
            </div>
          )}
          <HeroSection episodes={episodes} onNav={nav} onPlay={handlePlay} playingId={isPlaying ? playingId : null} channelStats={channelStats} />
          <StatsSection channelStats={channelStats} episodeCount={episodes.length} />
          <EpisodeCarousel episodes={episodes} loading={loadingVideos} playingId={isPlaying ? playingId : null} onPlay={handlePlay} onViewEp={setViewingEp} />
          <EpisodesSection episodes={episodes} loading={loadingVideos} playingId={isPlaying ? playingId : null} onPlay={handlePlay} onViewEp={setViewingEp} />
          <AboutSection channelStats={channelStats} episodeCount={episodes.length} />
          <TestimonialsSection comments={comments} loadingComments={loadingComments} commentsError={commentsError} showAllComments={showAllComments} onToggleShowAll={() => setShowAllComments(s => !s)} />
          <SponsorsSection />
          <ContactSection />
          <Footer onNav={nav} />

          <AnimatePresence>
            {currentEp && (
              <AudioPlayer key={currentEp.id} ep={currentEp} isPlaying={isPlaying}
                onPlayPause={() => setPlayerPaused(p => !p)} onClose={() => { setPlayingId(null); setPlayerPaused(false) }} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {viewingEp && (
              <EpisodeModal episodes={episodes} ep={viewingEp} playing={isPlaying && playingId === viewingEp.id}
                onTogglePlay={() => handlePlay(viewingEp.id)} onClose={() => setViewingEp(null)} />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
