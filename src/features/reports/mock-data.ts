import { subDays, format, eachDayOfInterval, eachHourOfInterval, subHours } from 'date-fns'

const now = new Date()
const days30 = eachDayOfInterval({ start: subDays(now, 30), end: now })

// Generate hourly data for last 3 days (72 hours)
const hours72 = eachHourOfInterval({ start: subHours(now, 72), end: now })

// ─── Hourly data (for up to 3 days view) ────────────────────────────────────
export const mentionsByHour = hours72.map((h) => ({
  date: format(h, 'yyyy-MM-dd HH:mm'), // ISO format with hour
  dateLabel: format(h, 'MMM d HH:mm'), // Display format with date
  total: Math.floor(Math.random() * 15 + 2),
  positive: Math.floor(Math.random() * 8 + 1),
  neutral: Math.floor(Math.random() * 4 + 1),
  negative: Math.floor(Math.random() * 2),
  question: Math.floor(Math.random() * 2),
}))

export const mentionsByPlatformByHour = hours72.map((h) => ({
  date: format(h, 'yyyy-MM-dd HH:mm'),
  dateLabel: format(h, 'MMM d HH:mm'),
  telegram: Math.floor(Math.random() * 8 + 1),
  reddit: Math.floor(Math.random() * 3 + 1),
  youtube: Math.floor(Math.random() * 2),
  x: Math.floor(Math.random() * 2),
  instagram: Math.floor(Math.random() * 1),
  facebook: Math.floor(Math.random() * 1),
  tiktok: Math.floor(Math.random() * 1),
  web: Math.floor(Math.random() * 1),
}))

export const reachScoreByPlatformByHour = hours72.map((h) => ({
  date: format(h, 'yyyy-MM-dd HH:mm'),
  dateLabel: format(h, 'MMM d HH:mm'),
  telegram: Math.floor(Math.random() * 500 + 100),
  reddit: Math.floor(Math.random() * 200 + 50),
  youtube: Math.floor(Math.random() * 300 + 80),
  x: Math.floor(Math.random() * 150 + 30),
  instagram: Math.floor(Math.random() * 100 + 20),
  facebook: Math.floor(Math.random() * 80 + 20),
  tiktok: Math.floor(Math.random() * 50 + 10),
  web: Math.floor(Math.random() * 30 + 5),
}))

// ─── Our Activity (comments + reactions per day) ─────────────────────────────
export const activityByDay = days30.map((d) => {
  const auto = Math.floor(Math.random() * 14 + 2)
  const manual = Math.floor(Math.random() * 6 + 1)
  return {
    date: format(d, 'yyyy-MM-dd'), // ISO format for aggregation
    dateLabel: format(d, 'MMM d'), // Display format
    auto,
    manual,
    comments: auto + manual,
    reactions: Math.floor(Math.random() * 35 + 5),
  }
})

// Generate hourly activity data for last 3 days
export const activityByHour = hours72.map((h) => {
  const auto = Math.floor(Math.random() * 5 + 1)
  const manual = Math.floor(Math.random() * 3)
  return {
    date: format(h, 'yyyy-MM-dd HH:mm'),
    dateLabel: format(h, 'MMM d HH:mm'),
    auto,
    manual,
    comments: auto + manual,
    reactions: Math.floor(Math.random() * 10 + 2),
  }
})

// ─── Mentions over time ──────────────────────────────────────────────────────
export const mentionsByDay = days30.map((d) => ({
  date: format(d, 'yyyy-MM-dd'), // ISO format for aggregation
  dateLabel: format(d, 'MMM d'), // Display format
  total: Math.floor(Math.random() * 60 + 10),
  positive: Math.floor(Math.random() * 25 + 3),
  neutral: Math.floor(Math.random() * 15 + 2),
  negative: Math.floor(Math.random() * 10 + 1),
  question: Math.floor(Math.random() * 8),
}))

// ─── Mentions by platform ────────────────────────────────────────────────────
export const mentionsByPlatform = [
  { platform: 'telegram', count: 847 },
  { platform: 'reddit', count: 312 },
  { platform: 'youtube', count: 198 },
  { platform: 'x', count: 156 },
  { platform: 'instagram', count: 89 },
  { platform: 'facebook', count: 67 },
  { platform: 'tiktok', count: 43 },
  { platform: 'web', count: 21 },
]

// ─── Mentions by platform over time ──────────────────────────────────────────
export const mentionsByPlatformOverTime = days30.map((d) => ({
  date: format(d, 'yyyy-MM-dd'), // ISO format for aggregation
  dateLabel: format(d, 'MMM d'), // Display format
  telegram: Math.floor(Math.random() * 30 + 5),
  reddit: Math.floor(Math.random() * 12 + 2),
  youtube: Math.floor(Math.random() * 8 + 1),
  x: Math.floor(Math.random() * 6 + 1),
  instagram: Math.floor(Math.random() * 4 + 1),
  facebook: Math.floor(Math.random() * 3 + 1),
  tiktok: Math.floor(Math.random() * 2),
  web: Math.floor(Math.random() * 2),
}))

// ─── Reach Score by platform over time ───────────────────────────────────────
export const reachScoreByPlatform = days30.map((d) => ({
  date: format(d, 'yyyy-MM-dd'), // ISO format for aggregation
  dateLabel: format(d, 'MMM d'), // Display format
  telegram: Math.floor(Math.random() * 5000 + 1000),
  reddit: Math.floor(Math.random() * 2000 + 500),
  youtube: Math.floor(Math.random() * 3000 + 800),
  x: Math.floor(Math.random() * 1500 + 300),
  instagram: Math.floor(Math.random() * 1000 + 200),
  facebook: Math.floor(Math.random() * 800 + 200),
  tiktok: Math.floor(Math.random() * 500 + 100),
  web: Math.floor(Math.random() * 300 + 50),
}))

// ─── Mentions by sentiment ───────────────────────────────────────────────────
export const mentionsBySentiment = [
  { sentiment: 'positive', count: 612 },
  { sentiment: 'neutral', count: 489 },
  { sentiment: 'negative', count: 287 },
  { sentiment: 'question', count: 345 },
]

// ─── Top 10 authors/channels by reach score ──────────────────────────────────
export const topAuthors = [
  { rank: 1, author: 'crypto_daily', platform: 'telegram', totalScore: 48720, mentions: 34, avgRelevance: 87 },
  { rank: 2, author: 'TechReviewHQ', platform: 'youtube', totalScore: 35100, mentions: 12, avgRelevance: 92 },
  { rank: 3, author: 'defi_alpha', platform: 'telegram', totalScore: 28900, mentions: 28, avgRelevance: 78 },
  { rank: 4, author: 'u/blockchain_dev', platform: 'reddit', totalScore: 22450, mentions: 19, avgRelevance: 81 },
  { rank: 5, author: 'web3_insider', platform: 'x', totalScore: 19800, mentions: 45, avgRelevance: 73 },
  { rank: 6, author: 'fintech_news', platform: 'telegram', totalScore: 17200, mentions: 22, avgRelevance: 85 },
  { rank: 7, author: 'CryptoMaven', platform: 'instagram', totalScore: 14500, mentions: 8, avgRelevance: 90 },
  { rank: 8, author: 'altcoin_buzz', platform: 'telegram', totalScore: 12800, mentions: 31, avgRelevance: 69 },
  { rank: 9, author: 'DeFi_Degen', platform: 'x', totalScore: 11200, mentions: 16, avgRelevance: 76 },
  { rank: 10, author: 'token_analyst', platform: 'reddit', totalScore: 9800, mentions: 11, avgRelevance: 88 },
]

// ─── Summary stats ───────────────────────────────────────────────────────────
export const summary = {
  totalMentions: 1733,
  totalComments: 284,
  totalReactions: 612,
  totalReachScore: 248500, // Total reach score across all platforms
  avgRelevance: 74,
  avgSentimentScore: 0.62, // -1 to 1 scale
  topReachScore: 48720,
  activePlatforms: 8,
}

// ─── Engagement funnel ───────────────────────────────────────────────────────
export const engagementFunnel = [
  { stage: 'Mentions Found', count: 1733 },
  { stage: 'Relevant (≥50%)', count: 1289 },
  { stage: 'Commentable', count: 1045 },
  { stage: 'Auto-Replied', count: 612 },
  { stage: 'Manual Reply', count: 284 },
]

// ─── Keyword performance ─────────────────────────────────────────────────────
export const keywordPerformance = [
  { keyword: 'crypto wallet', mentions: 312, avgRelevance: 82, autoReplied: 189, sentiment: { positive: 45, neutral: 30, negative: 15, question: 10 } },
  { keyword: 'defi protocol', mentions: 245, avgRelevance: 76, autoReplied: 134, sentiment: { positive: 38, neutral: 28, negative: 22, question: 12 } },
  { keyword: 'blockchain security', mentions: 198, avgRelevance: 88, autoReplied: 156, sentiment: { positive: 52, neutral: 25, negative: 13, question: 10 } },
  { keyword: 'token launch', mentions: 167, avgRelevance: 71, autoReplied: 89, sentiment: { positive: 35, neutral: 32, negative: 20, question: 13 } },
  { keyword: 'web3 gaming', mentions: 134, avgRelevance: 69, autoReplied: 67, sentiment: { positive: 42, neutral: 28, negative: 18, question: 12 } },
]

// ─── Response Time Distribution ──────────────────────────────────────────────
export const responseTimeDistribution = [
  { bucket: '<1m', count: 89 },
  { bucket: '1-5m', count: 234 },
  { bucket: '5-15m', count: 178 },
  { bucket: '15-30m', count: 96 },
  { bucket: '30m-1h', count: 45 },
  { bucket: '1-3h', count: 28 },
  { bucket: '>3h', count: 12 },
]

export const responseTimeStats = {
  avgMinutes: 8.4,
  medianMinutes: 4.2,
  p95Minutes: 32,
}

// ─── Sentiment Trend (weekly) ────────────────────────────────────────────────
export const sentimentTrend = [
  { week: 'W1', positive: 62, neutral: 22, negative: 10, question: 6 },
  { week: 'W2', positive: 58, neutral: 24, negative: 12, question: 6 },
  { week: 'W3', positive: 65, neutral: 20, negative: 9, question: 6 },
  { week: 'W4', positive: 68, neutral: 18, negative: 8, question: 6 },
]

// ─── Peak Hours Heatmap ──────────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export const peakHoursData = DAYS.flatMap((day, di) =>
  HOURS.map((hour) => ({
    day,
    dayIndex: di,
    hour,
    hourLabel: `${hour}:00`,
    count: Math.floor(
      Math.random() * 20 *
      // More activity during business hours
      (hour >= 9 && hour <= 18 ? 2.5 : hour >= 6 && hour <= 22 ? 1.2 : 0.3) *
      // Less on weekends
      (di >= 5 ? 0.5 : 1)
    ),
  }))
)

// ─── Brand vs Competitor mentions ────────────────────────────────────────────
export const brandVsCompetitor = [
  { name: 'Our Brand', mentions: 847, sentiment: 72 },
  { name: 'Competitor A', mentions: 523, sentiment: 58 },
  { name: 'Competitor B', mentions: 312, sentiment: 64 },
  { name: 'Competitor C', mentions: 198, sentiment: 45 },
]
