/**
 * Shared API Types
 */

export interface APIError {
  message: string
  status: number
  detail?: string
}

export interface TokenData {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  full_name: string
  language_preference: 'en' | 'ru'
  password: string
  confirm_password: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export interface UserProfile {
  email: string
  full_name: string | null
  profile_picture: string | null
  language_preference: string | null
  is_active: boolean
  is_blocked: boolean
  id: string
  google_id: string | null
  created_at: string
  updated_at: string
}

// ─── Project Types ───────────────────────────────────────────────────────────

export interface Project {
  id: string
  customer_id: string
  brand_name: string
  brand_description: string
  brand_website: string
  brand_tags: string[]
  created_at: string
  updated_at: string
  last_search: string
  comment_preview_count: number
  comment_preview_relevance: number
}

export interface ProjectsResponse {
  owned: Project[]
  shared: SharedProject[]
}

export interface SharedProject extends Project {
  owner_email: string
  owner_name: string | null
  role: 'viewer' | 'editor'
  shared_at: string
}

// ─── Mention Types ───────────────────────────────────────────────────────────

export interface APIMention {
  id: string
  request: string
  platform: string
  post_id: string
  content: string
  author: string
  link: string
  score: {
    views: number
    shares_count: number
    unified_score: number
    comments_count: number
    reactions_count: number
  }
  ai_analysis: {
    summary: string
    relevance: number
    sentiment: string
  }
  comment_analysis: {
    exists?: boolean
    checked: boolean
    channel_id?: number
    checked_at?: string
    commentable: boolean | string
    reactable?: boolean
    channel_username?: string
    error?: string
  }
  possible_reactions: Record<string, number[]>
  replied: 'not_replied' | 'auto' | 'manual'
  shown: boolean
  project_id: string
  created_at: string
  posted_at: string
  channel_subscription_id: string | null
  post_subscription_id: string | null
  comment_tree: APIComment[] | null
}

export interface APIComment {
  id: string
  comment_id: number | null
  author_username: string | null
  author_name: string | null
  content: string
  link: string | null
  possible_reactions: Record<string, number[]>
  relevance: number | null
  sentiment: string | null
  created_at: string | null
  parent_comment_id: number | null
  is_our_comment: boolean
  is_auto: boolean
  deleted: boolean
  state: string
  replies: APIComment[]
}

export interface MentionsResponse {
  mentions: APIMention[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ─── Project Mutation Types ──────────────────────────────────────────────────

export interface UpdateProjectRequest {
  brand_name: string
  brand_description: string
  brand_website: string
  brand_tags: string[]
  comment_preview_count?: number
  comment_preview_relevance?: number
}

// ─── Collaborator Types ──────────────────────────────────────────────────────

export interface Collaborator {
  id: string
  project_id: string
  customer_id: string
  customer_email: string
  customer_name: string | null
  role: 'viewer' | 'editor'
  granted_by: string | null
  created_at: string
}

export interface GrantAccessRequest {
  email: string
  role: 'viewer' | 'editor'
}

export interface UpdateAccessRequest {
  role: 'viewer' | 'editor'
}

// ─── Keyword Types ───────────────────────────────────────────────────────────

export interface APIKeyword {
  id: string
  keyword: string
  excluded_keywords: string[]
  additional_hint_search: string | null
  additional_hint_reply: string | null
  reply_mode: 'manual' | 'auto'
  postpone_interval: number | null
  scenario_depth: number
  comment_count_min: number | null
  comment_count_max: number | null
  show_mention_threshold: number
  autoreply_mention_threshold: number | null
  autoreply_mention_score_threshold: number | null
  autoreact_mention_threshold: number | null
  autoreact_mention_score_threshold: number | null
  autoreact_sentiments: Record<string, string[]> | null
  keyword_type: 'brand' | 'competitor' | 'general'
  platform_youtube: boolean
  platform_tiktok: boolean
  platform_facebook: boolean
  platform_instagram: boolean
  platform_reddit: boolean
  platform_twitter: boolean
  platform_telegram: boolean
  platform_web: boolean
  project_id: string
  is_active: boolean
  sync_status: string
  created_at: string
  updated_at: string
}

export interface CreateKeywordRequest {
  keyword: string
  excluded_keywords: string[]
  is_active: boolean
  additional_hint_search?: string
  additional_hint_reply?: string
  comment_count_min: number | null
  comment_count_max: number | null
  show_mention_threshold: number
  autoreply_mention_threshold: number
  autoreply_mention_score_threshold: number
  autoreact_mention_threshold: number
  autoreact_sentiments: Record<string, string[]>
  keyword_type?: 'brand' | 'competitor' | 'general'
  platform_youtube: boolean
  platform_tiktok: boolean
  platform_facebook: boolean
  platform_instagram: boolean
  platform_reddit: boolean
  platform_twitter: boolean
  platform_telegram: boolean
  platform_web: boolean
}

export interface KeywordsResponse {
  keywords: APIKeyword[]
  total: number
}

export interface KeywordSuggestions {
  my_brand_suggestions: string[]
  current_products_and_services_suggestions: string[]
  potential_products_and_services_suggestions: string[]
  competitions: string[]
}

// ─── Channel Types ───────────────────────────────────────────────────────────

export interface APIChannelSubscription {
  id: string
  project_id: string
  channel_username: string
  channel_id: string | null
  channel_title: string | null
  status: 'active' | 'inactive' | 'paused'
  show_post_threshold: number
  autoreact_post_threshold: number
  autoreply_post_threshold: number
  autoreact_post_score_threshold: number | null
  autoreply_post_score_threshold: number | null
  autoreact_sentiments: Record<string, string[]> | null
  autoreply_sentiments: string[]
  comment_count_min: number | null
  comment_count_max: number | null
  total_posts: number
  new_posts: number
  active_posts: number
  created_at: string
  last_polled_at: string
  additional_hint_reply: string | null
  additional_hint_search: string | null
}

export interface CreateChannelRequest {
  channel_username: string
  status: 'active' | 'inactive' | 'paused'
  show_post_threshold: number
  autoreact_post_threshold: number
  autoreply_post_threshold: number
  autoreact_post_score_threshold: number | null
  autoreply_post_score_threshold: number | null
  autoreact_sentiments: Record<string, string[]>
  autoreply_sentiments: string[]
  comment_count_min: number | null
  comment_count_max: number | null
  additional_hint_reply?: string
  additional_hint_search?: string
}
