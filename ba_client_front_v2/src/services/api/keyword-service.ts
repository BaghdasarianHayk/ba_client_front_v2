import { apiClient } from './client'
import { API_ENDPOINTS } from '@/config/api-config'
import type {
  APIKeyword,
  CreateKeywordRequest,
  KeywordsResponse,
  KeywordSuggestions,
} from './types'
import type { PlatformId } from '@/components/platform-icon'

// ─── Frontend keyword type ───────────────────────────────────────────────────

type SentimentId = 'positive' | 'negative' | 'neutral' | 'question'
type ReactionType = 'POSITIVE' | 'NEGATIVE' | null

export interface Keyword {
  id: string
  keyword: string
  excludedKeywords: string[]
  platforms: PlatformId[]
  isActive: boolean
  showThreshold: number
  filteringPrompt: string
  autoComment: {
    enabled: boolean
    threshold: number
    scoreThreshold: number
    countMin: number
    countMax: number
    rules: string
  }
  autoReact: {
    enabled: boolean
    threshold: number
    sentiments: Record<SentimentId, ReactionType>
  }
  keywordType: 'brand' | 'competitor' | 'general'
  mentionsCount: number
  createdAt: string
  updatedAt: string
}

// ─── Transform ───────────────────────────────────────────────────────────────

function mapSentiments(
  api: Record<string, string[]> | null
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

function transform(api: APIKeyword, mentionsCount = 0): Keyword {
  const platforms: PlatformId[] = []
  if (api.platform_reddit) platforms.push('reddit')
  if (api.platform_telegram) platforms.push('telegram')
  if (api.platform_twitter) platforms.push('x')
  if (api.platform_youtube) platforms.push('youtube')
  if (api.platform_instagram) platforms.push('instagram')
  if (api.platform_facebook) platforms.push('facebook')
  if (api.platform_tiktok) platforms.push('tiktok')
  if (api.platform_web) platforms.push('web')

  const autoCommentOn =
    api.autoreply_mention_threshold !== 101 &&
    api.autoreply_mention_threshold !== null
  const autoReactOn =
    api.autoreact_mention_threshold !== 101 &&
    api.autoreact_mention_threshold !== null

  return {
    id: api.id,
    keyword: api.keyword,
    excludedKeywords: api.excluded_keywords,
    platforms,
    isActive: api.is_active,
    showThreshold: api.show_mention_threshold,
    filteringPrompt: api.additional_hint_search || '',
    autoComment: {
      enabled: autoCommentOn,
      threshold: autoCommentOn
        ? (api.autoreply_mention_threshold ?? 85)
        : 85,
      scoreThreshold: api.autoreply_mention_score_threshold ?? 0,
      countMin: api.comment_count_min ?? 0,
      countMax: api.comment_count_max ?? 10,
      rules: api.additional_hint_reply || '',
    },
    autoReact: {
      enabled: autoReactOn,
      threshold: autoReactOn
        ? (api.autoreact_mention_threshold ?? 70)
        : 70,
      sentiments: mapSentiments(api.autoreact_sentiments),
    },
    keywordType: api.keyword_type ?? 'general',
    mentionsCount,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const KeywordService = {
  async getKeywords(projectId: string, mentionCounts?: Map<string, number>): Promise<Keyword[]> {
    const url = API_ENDPOINTS.KEYWORDS.LIST.replace(':projectId', projectId)
    const res = await apiClient.get<KeywordsResponse>(url)
    return res.keywords.map((k) => transform(k, mentionCounts?.get(k.id) ?? 0))
  },

  async createKeyword(
    projectId: string,
    data: CreateKeywordRequest
  ): Promise<Keyword> {
    const url = API_ENDPOINTS.KEYWORDS.CREATE.replace(':projectId', projectId)
    const api = await apiClient.post<APIKeyword>(url, data)
    return transform(api)
  },

  async updateKeyword(
    keywordId: string,
    data: Partial<CreateKeywordRequest>
  ): Promise<Keyword> {
    const url = API_ENDPOINTS.KEYWORDS.UPDATE.replace(':keywordId', keywordId)
    const api = await apiClient.put<APIKeyword>(url, data)
    return transform(api)
  },

  async deleteKeyword(keywordId: string, softDelete = true): Promise<void> {
    const url = API_ENDPOINTS.KEYWORDS.DELETE.replace(':keywordId', keywordId)
    await apiClient.delete(`${url}?soft_delete=${softDelete}`)
  },

  async activate(keywordId: string): Promise<void> {
    const url = API_ENDPOINTS.KEYWORDS.ACTIVATE.replace(':keywordId', keywordId)
    await apiClient.patch(url, {})
  },

  async deactivate(keywordId: string): Promise<void> {
    const url = API_ENDPOINTS.KEYWORDS.DEACTIVATE.replace(':keywordId', keywordId)
    await apiClient.patch(url, {})
  },

  async getSuggestions(projectId: string): Promise<KeywordSuggestions> {
    return apiClient.get<KeywordSuggestions>(
      `/projects/get_suggestions?project_id=${projectId}`
    )
  },
}
