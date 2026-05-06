import { apiClient } from './client'
import { API_ENDPOINTS } from '@/config/api-config'
import type { APIMention, APIComment, MentionsResponse } from './types'
import type { PlatformId } from '@/components/platform-icon'

// ─── Platform mapping ────────────────────────────────────────────────────────

const VALID_PLATFORMS = new Set([
  'reddit', 'telegram', 'x', 'youtube', 'instagram', 'facebook', 'tiktok', 'web',
])

function mapPlatform(api: string): PlatformId {
  const n = api.toLowerCase()
  if (n === 'twitter') return 'x'
  if (VALID_PLATFORMS.has(n)) return n as PlatformId
  return 'web'
}

// ─── Transformed types (what the UI consumes) ────────────────────────────────

export interface Mention {
  id: string
  postUrl: string
  platform: PlatformId
  postedAt: string
  author: string
  keyword: string
  content: string
  summary: string
  unifiedScore: number
  sentiment: 'positive' | 'neutral' | 'negative' | 'question'
  relevance: number
  possibleReactions: Record<string, number[]>
  commentable: boolean
  reactable: boolean
  isDeleted: boolean
  commentsCheckedAt?: string
  comments: MentionComment[]
  commentCount: number
  commentSentiments: {
    positive: number
    neutral: number
    negative: number
    question: number
  }
  /** Non-null if this post is already being tracked */
  postSubscriptionId: string | null
  /** Non-null if this channel is already being followed */
  channelSubscriptionId: string | null
  /** Channel username (Telegram) if detected */
  channelUsername: string | null
}

export interface MentionComment {
  id: string
  authorUsername: string | null
  authorName: string | null
  content: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'question' | null
  relevance: number | null
  postedAt: string
  postUrl: string | null
  possibleReactions: Record<string, number[]>
  isOurComment: boolean
  isAuto: boolean
  isDeleted: boolean
  isPending: boolean
  replies: MentionComment[]
}

// ─── Stats helpers ───────────────────────────────────────────────────────────

function countComments(comments: MentionComment[]): {
  total: number
  positive: number
  neutral: number
  negative: number
  question: number
} {
  const stats = { total: 0, positive: 0, neutral: 0, negative: 0, question: 0 }
  function walk(list: MentionComment[]) {
    for (const c of list) {
      stats.total++
      if (c.sentiment) stats[c.sentiment]++
      walk(c.replies)
    }
  }
  walk(comments)
  return stats
}

// ─── Transform functions ─────────────────────────────────────────────────────

function transformComment(api: APIComment): MentionComment {
  return {
    id: api.id,
    authorUsername: api.author_username,
    authorName: api.author_name,
    content: api.content,
    sentiment: api.sentiment
      ? (api.sentiment.toLowerCase() as MentionComment['sentiment'])
      : null,
    relevance: api.relevance,
    postedAt: api.created_at ?? new Date().toISOString(),
    postUrl: api.link,
    possibleReactions: api.possible_reactions ?? {},
    isOurComment: api.is_our_comment,
    isAuto: api.is_auto ?? false,
    isDeleted: api.deleted,
    isPending: api.state === 'PENDING',
    replies: api.replies?.map(transformComment) ?? [],
  }
}

function transformMention(api: APIMention): Mention {
  const comments = api.comment_tree?.map(transformComment) ?? []
  const stats = countComments(comments)

  return {
    id: api.id,
    postUrl: api.link,
    platform: mapPlatform(api.platform),
    postedAt: api.posted_at,
    author: api.author,
    keyword: api.request,
    content: api.content,
    summary: api.ai_analysis.summary,
    unifiedScore: api.score.unified_score,
    sentiment: api.ai_analysis.sentiment.toLowerCase() as Mention['sentiment'],
    relevance: api.ai_analysis.relevance,
    possibleReactions: api.possible_reactions ?? {},
    commentable:
      api.platform === 'telegram'
        ? Boolean(api.comment_analysis.commentable)
        : api.platform !== 'web',
    reactable: api.comment_analysis.reactable ?? true,
    isDeleted: api.comment_analysis.exists === false,
    commentsCheckedAt: api.comment_analysis.checked_at,
    comments,
    commentCount: stats.total,
    commentSentiments: {
      positive: stats.positive,
      neutral: stats.neutral,
      negative: stats.negative,
      question: stats.question,
    },
    postSubscriptionId: api.post_subscription_id ?? null,
    channelSubscriptionId: api.channel_subscription_id ?? null,
    channelUsername: api.comment_analysis.channel_username ?? null,
  }
}

// ─── Stats type ──────────────────────────────────────────────────────────────

export interface MentionStats {
  project_id: string
  active_keywords: { keyword: string; id: string; count: number }[]
  inactive_keywords: { keyword: string; id: string; count: number }[]
  deleted_keywords: { keyword: string; id: string; count: number }[]
  max_unified_score: number
  min_unified_score: number
  max_relevance: number | null
  min_relevance: number | null
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface MentionFilters {
  page?: number
  per_page?: number
  search?: string
  sentiment?: string
  platform?: string
  order_by?: 'posted_at' | 'unified_score' | 'relevance'
  order_direction?: 'asc' | 'desc'
  posted_at_from?: string
  posted_at_to?: string
  replied?: string
  unified_score_from?: number
  unified_score_to?: number
  relevance_from?: number
  relevance_to?: number
  keywords?: string
  has_comments?: boolean
  is_commentable?: boolean
}

function buildParams(filters?: MentionFilters): string {
  if (!filters) return ''
  const p = new URLSearchParams()
  const set = (k: string, v: string | number | boolean | undefined) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  }
  set('page', filters.page)
  set('per_page', filters.per_page)
  set('search', filters.search)
  set('sentiment', filters.sentiment)
  set('platform', filters.platform)
  set('order_by', filters.order_by)
  set('order_direction', filters.order_direction)
  set('posted_at_from', filters.posted_at_from)
  set('posted_at_to', filters.posted_at_to)
  set('replied', filters.replied)
  set('unified_score_from', filters.unified_score_from)
  set('unified_score_to', filters.unified_score_to)
  set('relevance_from', filters.relevance_from)
  set('relevance_to', filters.relevance_to)
  set('keywords', filters.keywords)
  if (filters.has_comments !== undefined) set('has_comments', filters.has_comments)
  if (filters.is_commentable !== undefined) set('is_commentable', filters.is_commentable)
  return p.toString()
}

export const MentionService = {
  async getMention(
    projectId: string,
    mentionId: string
  ): Promise<Mention> {
    const endpoint = API_ENDPOINTS.MENTIONS.DETAIL
      .replace(':projectId', projectId)
      .replace(':mentionId', mentionId)
    const res = await apiClient.get<APIMention>(endpoint)
    return transformMention(res)
  },

  async getMentions(
    projectId: string,
    filters?: MentionFilters
  ): Promise<{ mentions: Mention[]; total: number; totalPages: number }> {
    const endpoint = API_ENDPOINTS.MENTIONS.LIST.replace(
      ':projectId',
      projectId
    )
    const qs = buildParams(filters)
    const url = qs ? `${endpoint}?${qs}` : endpoint
    const res = await apiClient.get<MentionsResponse>(url)
    return {
      mentions: res.mentions.map(transformMention),
      total: res.total,
      totalPages: res.total_pages,
    }
  },

  async getStats(
    projectId: string,
    postedAtFrom?: string,
    postedAtTo?: string
  ): Promise<MentionStats> {
    const endpoint = API_ENDPOINTS.MENTIONS.STATS.replace(
      ':projectId',
      projectId
    )
    const p = new URLSearchParams()
    if (postedAtFrom) p.set('posted_at_from', postedAtFrom)
    if (postedAtTo) p.set('posted_at_to', postedAtTo)
    const qs = p.toString()
    return apiClient.get<MentionStats>(qs ? `${endpoint}?${qs}` : endpoint)
  },
}
