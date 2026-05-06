import { apiClient } from './client'
import { API_ENDPOINTS } from '@/config/api-config'
import type { PlatformId } from '@/components/platform-icon'
import type { PostData, CommentData } from '@/features/sheet/types'

// ─── API types ───────────────────────────────────────────────────────────────

interface APIChannelSubscription {
  id: string
  channel_username: string
  channel_id: string | null
  channel_title: string | null
  status: 'active' | 'inactive' | 'paused'
  total_posts: number
  new_posts: number
  active_posts: number
  created_at: string
  last_polled_at: string
}

interface ChannelsResponse {
  subscriptions: APIChannelSubscription[]
  stats: {
    total_subscriptions: number
    active_subscriptions: number
    total_posts: number
    new_posts: number
  }
  pagination: { total: number; page: number; per_page: number; total_pages: number }
}

interface ChannelComment {
  id: string
  comment_id: number
  parent_comment_id: number | null
  author_username: string | null
  author_name: string | null
  content: string
  link: string
  possible_reactions: Record<string, number[]> | null
  created_at: string
  relevance: number | null
  sentiment: string | null
  is_our_comment: boolean
  is_auto: boolean
  deleted: boolean
  state: string
  replies: ChannelComment[]
}

interface ChannelPost {
  id: string
  post_content: string
  post_author: string | null
  post_url: string
  post_date: string
  reactions_json: Record<string, number[]>
  ai_analysis: { summary: string; relevance: number; sentiment: string }
  channel_username: string | null
  comment_count: number
  is_deleted: boolean
  last_fetched_at: string | null
  comments_tree: ChannelComment[]
}

interface ChannelFull {
  id: string
  channel_username: string
  channel_title: string | null
  status: string
  posts: ChannelPost[]
  total_posts: number
}

// ─── Frontend types ──────────────────────────────────────────────────────────

export interface Following {
  id: string
  username: string
  platform: PlatformId
  status: 'active' | 'inactive' | 'paused'
  postsCount: number
  lastSync: string
}

type SentimentId = 'positive' | 'negative' | 'neutral' | 'question'
type ReactionType = 'POSITIVE' | 'NEGATIVE' | null

export interface ChannelDetail {
  id: string
  username: string
  status: 'active' | 'inactive' | 'paused'
  showThreshold: number
  filteringPrompt: string
  autoComment: {
    enabled: boolean
    threshold: number
    scoreThreshold: number
    countMin: number
    countMax: number
    aiPrompt: string
  }
  autoReact: {
    enabled: boolean
    threshold: number
    sentiments: Record<SentimentId, ReactionType>
  }
}

function mapSentiments(api: Record<string, string[]> | null): Record<SentimentId, ReactionType> {
  const r: Record<SentimentId, ReactionType> = { positive: null, negative: null, neutral: null, question: null }
  if (!api) return r
  const map: Record<string, SentimentId> = { POSITIVE: 'positive', NEGATIVE: 'negative', NEUTRAL: 'neutral', QUESTION: 'question' }
  for (const [k, v] of Object.entries(api)) {
    const id = map[k]
    if (id && v?.[0]) r[id] = v[0] as ReactionType
  }
  return r
}

function transformChannelDetail(api: import('./types').APIChannelSubscription): ChannelDetail {
  const autoCommentOn = api.autoreply_post_threshold !== 101 && api.autoreply_post_threshold != null
  const autoReactOn = api.autoreact_post_threshold !== 101 && api.autoreact_post_threshold != null
  return {
    id: api.id,
    username: api.channel_username,
    status: api.status,
    showThreshold: api.show_post_threshold,
    filteringPrompt: api.additional_hint_search || '',
    autoComment: {
      enabled: autoCommentOn,
      threshold: autoCommentOn ? api.autoreply_post_threshold : 85,
      scoreThreshold: api.autoreply_post_score_threshold ?? 0,
      countMin: api.comment_count_min ?? 0,
      countMax: api.comment_count_max ?? 10,
      aiPrompt: api.additional_hint_reply || '',
    },
    autoReact: {
      enabled: autoReactOn,
      threshold: autoReactOn ? api.autoreact_post_threshold : 70,
      sentiments: mapSentiments(api.autoreact_sentiments),
    },
  }
}

// ─── Transform helpers ───────────────────────────────────────────────────────

function transformComment(c: ChannelComment, postOwner?: string): CommentData {
  const reactions = Object.entries(c.possible_reactions ?? {})
    .filter(([, ids]) => ids.length > 0)
    .map(([emoji, ids]) => ({ emoji, count: ids.length }))

  return {
    id: c.id,
    author: { username: c.author_name || c.author_username || 'Unknown' },
    body: c.content,
    sentiment: c.sentiment
      ? (c.sentiment.toLowerCase() as CommentData['sentiment'])
      : null,
    relevance: c.relevance,
    createdAt: new Date(c.created_at),
    postUrl: c.link || null,
    replies: c.replies?.map((r) => transformComment(r, postOwner)) ?? [],
    isOwn: c.is_our_comment,
    isAuto: c.is_auto ?? false,
    isDeleted: c.deleted,
    isPending: c.state === 'PENDING',
    reactions,
  }
}

function transformPost(post: ChannelPost, channelUsername: string): PostData {
  const comments = post.comments_tree?.map((c) =>
    transformComment(c, channelUsername)
  ) ?? []

  const countSentiments = (list: CommentData[]) => {
    const s = { positive: 0, neutral: 0, negative: 0, question: 0 }
    const walk = (items: CommentData[]) => {
      for (const c of items) {
        if (c.sentiment) s[c.sentiment]++
        walk(c.replies)
      }
    }
    walk(list)
    return s
  }

  const sentiments = countSentiments(comments)
  const totalComments = (function count(list: CommentData[]): number {
    return list.reduce((n, c) => n + 1 + count(c.replies), 0)
  })(comments)

  return {
    id: post.id,
    author: { username: post.post_author || channelUsername },
    platform: 'telegram',
    title: post.ai_analysis.summary,
    body: post.post_content,
    sentiment: post.ai_analysis.sentiment.toLowerCase() as PostData['sentiment'],
    reasons: [],
    unifiedScore: 0,
    relevance: post.ai_analysis.relevance,
    commentCount: totalComments,
    commentSentiments: sentiments,
    createdAt: new Date(post.post_date),
    availableEmojis: Object.keys(post.reactions_json ?? {}),
    postUrl: post.post_url,
    isDeleted: post.is_deleted,
    commentable: true,
    comments,
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const ChannelService = {
  async getChannels(projectId: string): Promise<Following[]> {
    const url = API_ENDPOINTS.CHANNELS.LIST.replace(':projectId', projectId)
    const res = await apiClient.get<ChannelsResponse>(`${url}?per_page=100`)
    return res.subscriptions.map((s) => ({
      id: s.id,
      username: s.channel_username,
      platform: 'telegram' as PlatformId,
      status: s.status,
      postsCount: s.total_posts,
      lastSync: s.last_polled_at,
    }))
  },

  async getChannelPosts(
    projectId: string,
    channelId: string
  ): Promise<{ channel: { username: string; status: string }; posts: PostData[] }> {
    const url = API_ENDPOINTS.CHANNELS.FULL.replace(
      ':projectId',
      projectId
    ).replace(':channelId', channelId)
    const res = await apiClient.get<ChannelFull>(url)
    return {
      channel: {
        username: res.channel_username,
        status: res.status,
      },
      posts: res.posts.map((p) => transformPost(p, res.channel_username)),
    }
  },

  async getChannel(
    projectId: string,
    channelId: string
  ): Promise<ChannelDetail> {
    const url = API_ENDPOINTS.CHANNELS.GET.replace(':projectId', projectId).replace(':channelId', channelId)
    const api = await apiClient.get<import('./types').APIChannelSubscription>(url)
    return transformChannelDetail(api)
  },

  async createChannel(
    projectId: string,
    data: import('./types').CreateChannelRequest
  ): Promise<Following> {
    const url = API_ENDPOINTS.CHANNELS.CREATE.replace(':projectId', projectId)
    const api = await apiClient.post<{ id: string; channel_username: string; status: string; total_posts: number; last_polled_at: string }>(url, data)
    return {
      id: api.id,
      username: api.channel_username,
      platform: 'telegram',
      status: api.status as Following['status'],
      postsCount: api.total_posts ?? 0,
      lastSync: api.last_polled_at ?? new Date().toISOString(),
    }
  },

  async updateChannel(
    projectId: string,
    channelId: string,
    data: Partial<import('./types').CreateChannelRequest>
  ): Promise<void> {
    const url = API_ENDPOINTS.CHANNELS.UPDATE.replace(':projectId', projectId).replace(':channelId', channelId)
    await apiClient.put(url, data)
  },

  async deleteChannel(projectId: string, channelId: string): Promise<void> {
    const url = API_ENDPOINTS.CHANNELS.DELETE.replace(':projectId', projectId).replace(':channelId', channelId)
    await apiClient.delete(url)
  },
}
