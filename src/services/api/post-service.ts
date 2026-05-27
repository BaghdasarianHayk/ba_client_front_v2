import { apiClient } from './client'
import { API_ENDPOINTS } from '@/config/api-config'
import type { PostData, CommentData } from '@/features/sheet/types'

// ─── API types ───────────────────────────────────────────────────────────────

interface APIPostSubscription {
  id: string
  channel_subscription_id: string | null
  mention_id: string | null
  post_id: number
  post_content: string
  post_author: string | null
  post_url: string | null
  post_date: string
  reactions_json: Record<string, number[]>
  ai_analysis: { summary: string; relevance: number; sentiment: string }
  state: string
  status: 'active' | 'inactive'
  channel_username: string | null
  comment_count: number
  is_deleted: boolean
  created_at: string
  last_fetched_at: string | null
  // Auto-action fields
  comment_count_min?: number | null
  comment_count_max?: number | null
  additional_hint_reply?: string | null
  autoreact_comment_threshold?: number
  autoreply_comment_threshold?: number
  autoreact_comment_score_threshold?: number
  autoreply_comment_score_threshold?: number
  autoreact_sentiments?: Record<string, string[]> | null
  autoreply_sentiments?: string[]
}

interface PostsResponse {
  posts: APIPostSubscription[]
  pagination: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

interface APIPostComment {
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
  replies: APIPostComment[]
}

interface PostFull {
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
  comments_tree: APIPostComment[]
}

export interface CreatePostRequest {
  post_url: string
  status: 'active' | 'inactive'
  comment_count_min: number | null
  comment_count_max: number | null
  additional_hint_reply?: string
  autoreact_comment_threshold: number
  autoreply_comment_threshold: number
  autoreact_comment_score_threshold: number
  autoreply_comment_score_threshold: number
  autoreact_sentiments: Record<string, string[]>
  autoreply_sentiments: string[]
}

// ─── Frontend types ──────────────────────────────────────────────────────────

type SentimentId = 'positive' | 'negative' | 'neutral' | 'question'
type ReactionType = 'POSITIVE' | 'NEGATIVE' | null

export interface TrackedPost {
  id: string
  url: string
  status: 'active' | 'inactive'
  author: string
  content: string
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'question'
  relevance: number
  commentCount: number
  isDeleted: boolean
  createdAt: string
  lastFetchedAt: string | null
  channelUsername: string | null
  reactions: Record<string, number[]>
  autoReply: {
    enabled: boolean
    threshold: number
    scoreThreshold: number
    countMin: number
    countMax: number
    sentiments: string[]
    aiPrompt: string
  }
  autoReact: {
    enabled: boolean
    threshold: number
    sentiments: Record<SentimentId, ReactionType>
  }
}

// ─── Transform helpers ───────────────────────────────────────────────────────

function mapSentiments(
  api: Record<string, string[]> | null | undefined
): Record<SentimentId, ReactionType> {
  const r: Record<SentimentId, ReactionType> = {
    positive: null,
    negative: null,
    neutral: null,
    question: null,
  }
  if (!api) return r
  const map: Record<string, SentimentId> = {
    POSITIVE: 'positive',
    NEGATIVE: 'negative',
    NEUTRAL: 'neutral',
    QUESTION: 'question',
  }
  for (const [k, v] of Object.entries(api)) {
    const id = map[k]
    if (id && v?.[0]) r[id] = v[0] as ReactionType
  }
  return r
}

function transformPost(api: APIPostSubscription): TrackedPost {
  const autoReplyOn =
    api.autoreply_comment_threshold !== undefined &&
    api.autoreply_comment_threshold !== 101 &&
    api.autoreply_comment_threshold != null
  const autoReactOn =
    api.autoreact_comment_threshold !== undefined &&
    api.autoreact_comment_threshold !== 101 &&
    api.autoreact_comment_threshold != null

  return {
    id: api.id,
    url:
      api.post_url ||
      `https://t.me/${api.channel_username}/${api.post_id}`,
    status: api.status,
    author: api.post_author || api.channel_username || 'Unknown',
    content: api.post_content || '',
    summary: api.ai_analysis?.summary || '',
    sentiment: (api.ai_analysis?.sentiment?.toLowerCase() ||
      'neutral') as TrackedPost['sentiment'],
    relevance: api.ai_analysis?.relevance || 0,
    commentCount: api.comment_count,
    isDeleted: api.is_deleted,
    createdAt: api.created_at,
    lastFetchedAt: api.last_fetched_at,
    channelUsername: api.channel_username,
    reactions: api.reactions_json || {},
    autoReply: {
      enabled: autoReplyOn,
      threshold: autoReplyOn ? api.autoreply_comment_threshold! : 70,
      scoreThreshold: api.autoreply_comment_score_threshold ?? 0,
      countMin: api.comment_count_min ?? 0,
      countMax: api.comment_count_max ?? 10,
      sentiments: api.autoreply_sentiments ?? [],
      aiPrompt: api.additional_hint_reply || '',
    },
    autoReact: {
      enabled: autoReactOn,
      threshold: autoReactOn ? api.autoreact_comment_threshold! : 70,
      sentiments: mapSentiments(api.autoreact_sentiments),
    },
  }
}

function transformComment(c: APIPostComment): CommentData {
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
    replies: c.replies?.map(transformComment) ?? [],
    isOwn: c.is_our_comment,
    isAuto: c.is_auto ?? false,
    isDeleted: c.deleted,
    isPending: c.state === 'PENDING',
    reactions,
  }
}

export function trackedPostToPostData(tp: TrackedPost): PostData {
  return {
    id: tp.id,
    source: 'tracked-post',
    author: { username: tp.author },
    platform: 'telegram',
    title: tp.summary,
    body: tp.content,
    sentiment: tp.sentiment,
    reasons: [],
    unifiedScore: 0,
    relevance: tp.relevance,
    commentCount: tp.commentCount,
    commentSentiments: { positive: 0, neutral: 0, negative: 0, question: 0 },
    createdAt: new Date(tp.createdAt),
    availableEmojis: Object.keys(tp.reactions),
    postUrl: tp.url,
    isDeleted: tp.isDeleted,
    commentable: true,
    comments: [],
    trackedPostId: tp.id,
    trackedPostActive: tp.status === 'active',
    channelUsername: tp.channelUsername,
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const PostService = {
  async getPosts(
    projectId: string
  ): Promise<{ posts: TrackedPost[]; total: number }> {
    const url = API_ENDPOINTS.POSTS.LIST.replace(':projectId', projectId)
    const res = await apiClient.get<PostsResponse>(`${url}?per_page=100`)
    return {
      posts: res.posts.map(transformPost),
      total: res.pagination.total,
    }
  },

  async getPost(projectId: string, postId: string): Promise<TrackedPost> {
    const url = API_ENDPOINTS.POSTS.GET.replace(
      ':projectId',
      projectId
    ).replace(':postId', postId)
    const api = await apiClient.get<APIPostSubscription>(url)
    return transformPost(api)
  },

  async getPostFull(
    projectId: string,
    postId: string
  ): Promise<{ post: TrackedPost; comments: CommentData[] }> {
    const url = API_ENDPOINTS.POSTS.FULL.replace(
      ':projectId',
      projectId
    ).replace(':postId', postId)
    const res = await apiClient.get<PostFull>(url)
    const post = transformPost({
      id: res.id,
      post_content: res.post_content,
      post_author: res.post_author,
      post_url: res.post_url,
      post_date: res.post_date,
      reactions_json: res.reactions_json,
      ai_analysis: res.ai_analysis,
      channel_username: res.channel_username,
      comment_count: res.comment_count,
      is_deleted: res.is_deleted,
      status: 'active',
      state: '',
      post_id: 0,
      channel_subscription_id: null,
      mention_id: null,
      created_at: res.post_date,
      last_fetched_at: null,
    } as APIPostSubscription)
    return {
      post,
      comments: res.comments_tree?.map(transformComment) ?? [],
    }
  },

  async createPost(
    projectId: string,
    data: CreatePostRequest
  ): Promise<TrackedPost> {
    const url = API_ENDPOINTS.POSTS.CREATE.replace(':projectId', projectId)
    const api = await apiClient.post<APIPostSubscription>(url, data)
    return transformPost(api)
  },

  async updatePost(
    projectId: string,
    postId: string,
    data: Partial<CreatePostRequest>
  ): Promise<void> {
    const url = API_ENDPOINTS.POSTS.UPDATE.replace(
      ':projectId',
      projectId
    ).replace(':postId', postId)
    await apiClient.patch(url, data)
  },

  async deletePost(projectId: string, postId: string): Promise<void> {
    const url = API_ENDPOINTS.POSTS.DELETE.replace(
      ':projectId',
      projectId
    ).replace(':postId', postId)
    await apiClient.delete(url)
  },
}
