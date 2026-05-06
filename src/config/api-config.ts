/**
 * API Configuration
 * Central configuration for API client settings
 */

export const API_CONFIG = {
  BASE_URL:
    import.meta.env.VITE_API_URL ||
    'https://app-api-stg.brandadvocate.ai/api/v1',
  POSTER_BASE_URL:
    import.meta.env.VITE_POSTER_API_URL ||
    'https://poster-stg.brandadvocate.ai/api/v1',
  KNOWLEDGE_BASE_URL:
    import.meta.env.VITE_KNOWLEDGE_BASE_API_URL ||
    'https://qaservice-dev.brandadvocate.ai/api/v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 1,
  TOKEN_REFRESH_BUFFER: 60000,
} as const

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ba_access_token',
  REFRESH_TOKEN: 'ba_refresh_token',
  KEYWORD_SUGGESTIONS_PREFIX: 'ba_keyword_suggestions_',
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    SEND_VERIFICATION_EMAIL: '/auth/send-verification-email',
    SEND_RESET_EMAIL: '/auth/send-reset-email',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE: '/auth/google',
  },
  CUSTOMER: {
    ME: '/customer/me',
  },
  PROJECTS: {
    LIST: '/projects/',
    CREATE: '/projects/',
    UPDATE: '/projects/:projectId',
    DELETE: '/projects/:projectId',
    EXPORT: '/reports/export',
    REPLY_SUGGESTION: '/projects/:projectId/get_reply_suggestion',
    COLLABORATORS: '/projects/:projectId/collaborators',
    COLLABORATOR: '/projects/:projectId/collaborators/:accessId',
  },
  MENTIONS: {
    LIST: '/mentions/:projectId',
    DETAIL: '/mentions/:projectId/:mentionId',
    STATS: '/mentions/:projectId/stats/count_by_keyword',
  },
  KEYWORDS: {
    LIST: '/projects/:projectId/keywords',
    GET: '/projects/keywords/:keywordId',
    CREATE: '/projects/:projectId/keywords',
    UPDATE: '/projects/keywords/:keywordId',
    DELETE: '/projects/keywords/:keywordId',
    ACTIVATE: '/projects/keywords/:keywordId/activate',
    DEACTIVATE: '/projects/keywords/:keywordId/deactivate',
  },
  CHANNELS: {
    LIST: '/projects/:projectId/channels',
    GET: '/projects/:projectId/channels/:channelId',
    CREATE: '/projects/:projectId/channels',
    UPDATE: '/projects/:projectId/channels/:channelId',
    DELETE: '/projects/:projectId/channels/:channelId',
    FULL: '/projects/:projectId/channels/:channelId/full',
  },
  POSTS: {
    LIST: '/projects/:projectId/posts',
    GET: '/projects/:projectId/posts/:postId',
    CREATE: '/projects/:projectId/posts',
    UPDATE: '/projects/:projectId/posts/:postId',
    DELETE: '/projects/:projectId/posts/:postId',
    FULL: '/projects/:projectId/posts/:postId/full',
  },
} as const
