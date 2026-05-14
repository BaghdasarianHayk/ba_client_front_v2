import { type AxiosInstance } from 'axios'
import { API_CONFIG } from '@/config/api-config'
import { createApiClient } from './create-api-client'

// ─── Poster API client (separate microservice) ──────────────────────────────

const posterClient: AxiosInstance = createApiClient({
  baseURL: API_CONFIG.POSTER_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
})

async function post<T>(url: string, data?: unknown): Promise<T> {
  const res = await posterClient.post<T>(url, data)
  return res.data
}

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await posterClient.get<T>(url, { params })
  return res.data
}

// ─── Events ──────────────────────────────────────────────────────────────────

export const POSTER_TASK_CREATED_EVENT = 'poster:task-created'
export const POSTER_TASK_COMPLETED_EVENT = 'poster:task-completed'

function notifyTaskCreated() {
  window.dispatchEvent(new Event(POSTER_TASK_CREATED_EVENT))
}

export function notifyTaskCompleted() {
  window.dispatchEvent(new Event(POSTER_TASK_COMPLETED_EVENT))
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type PosterPlatform =
  | 'telegram'
  | 'x'
  | 'reddit'
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'facebook'

// ─── Platform endpoint map ───────────────────────────────────────────────────
// Telegram has COMMENT, REPLY, REACTION, DELETE_COMMENT
// Other platforms only have COMMENT

const ENDPOINTS: Record<
  PosterPlatform,
  {
    COMMENT: string
    REPLY?: string
    REACTION?: string
    DELETE_COMMENT?: string
  }
> = {
  telegram: {
    COMMENT: '/telegram/comments',
    REPLY: '/telegram/reply',
    REACTION: '/telegram/reactions/set',
    DELETE_COMMENT: '/telegram/comments/delete',
  },
  x: { COMMENT: '/twitter/comments' },
  reddit: { COMMENT: '/reddit/comments' },
  youtube: { COMMENT: '/youtube/comments' },
  tiktok: { COMMENT: '/tiktok/comments' },
  instagram: { COMMENT: '/instagram/comments' },
  facebook: { COMMENT: '/facebook/comments' },
}

// ─── Background tasks ────────────────────────────────────────────────────────

export interface BackgroundTask {
  id: string
  mention_id: string | null
  content: string
  platform: string
  priority: number
  status: 'done' | 'processing' | 'error'
  error: string | null
  created_at: string
  executed_at: string | null
  mention_author: string | null
  mention_link: string | null
  mention_content: string | null
  mention_project_id: string | null
}

export interface BackgroundTasksResponse {
  customer_id: string
  total_tasks: number
  tasks: BackgroundTask[]
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const PosterService = {
  /**
   * Post a comment to any platform using just the post URL.
   * Universal endpoint — works for all platforms.
   */
  async createManualComment(data: {
    content: string
    url: string
  }): Promise<void> {
    await post('/comments/comments', data)
    notifyTaskCreated()
  },

  /**
   * Post a new comment to a platform.
   * Provide either mention_id OR post_subscription_id, not both.
   */
  async createComment(
    platform: PosterPlatform,
    data: {
      content: string
      mention_id?: string
      post_subscription_id?: string
    }
  ): Promise<void> {
    const ep = ENDPOINTS[platform]
    if (!ep?.COMMENT)
      throw new Error(`Comment not supported for ${platform}`)
    await post(ep.COMMENT, data)
    notifyTaskCreated()
  },

  /**
   * Reply to an existing comment (Telegram only).
   * Uses the comment's telegram_url to target the reply.
   */
  async reply(
    platform: PosterPlatform,
    data: { telegram_url: string; reply_text: string }
  ): Promise<void> {
    const ep = ENDPOINTS[platform]
    if (!ep?.REPLY)
      throw new Error(`Reply not supported for ${platform}`)
    await post(ep.REPLY, data)
    notifyTaskCreated()
  },

  /**
   * Set a reaction on a post or comment (Telegram only).
   */
  async setReaction(
    platform: PosterPlatform,
    data: { telegram_url: string; reaction: string }
  ): Promise<void> {
    const ep = ENDPOINTS[platform]
    if (!ep?.REACTION)
      throw new Error(`Reactions not supported for ${platform}`)
    await post(ep.REACTION, data)
    notifyTaskCreated()
  },

  /**
   * Delete a comment (Telegram only, own comments only).
   */
  async deleteComment(
    platform: PosterPlatform,
    data: { telegram_url: string }
  ): Promise<void> {
    const ep = ENDPOINTS[platform]
    if (!ep?.DELETE_COMMENT)
      throw new Error(`Delete not supported for ${platform}`)
    await post(ep.DELETE_COMMENT, data)
    notifyTaskCreated()
  },

  /**
   * Get background tasks for a customer.
   */
  async getBackgroundTasks(
    customerId: string,
    limit = 20,
    offset = 0,
    filters?: { status?: string; created_from?: string; created_to?: string }
  ): Promise<BackgroundTasksResponse> {
    const params: Record<string, unknown> = { limit, offset }
    if (filters?.status) params.status = filters.status
    if (filters?.created_from) params.created_from = filters.created_from
    if (filters?.created_to) params.created_to = filters.created_to
    return get(
      `/background-tasks/customer/${customerId}`,
      params
    )
  },
}
