import type { PlatformId } from '@/components/platform-icon'

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'question'

export type PostSource = 'mention' | 'channel' | 'tracked-post'

export type PostData = {
  id: string
  /** Source of this post for tab filtering */
  source: PostSource
  author: { username: string; avatar?: string }
  platform: PlatformId
  title: string
  body: string
  sentiment: Sentiment
  reasons: ({ type: 'keyword'; keyword: string; keywordId?: string } | { type: 'following' })[]
  unifiedScore: number
  relevance: number
  commentCount: number
  commentSentiments: Record<Sentiment, number>
  createdAt: Date
  availableEmojis: string[]
  postUrl: string
  isDeleted: boolean
  commentable: boolean
  comments: CommentData[]
  /** Non-null if this post is being tracked (post subscription ID) */
  trackedPostId?: string | null
  /** Whether the tracked post has active monitoring */
  trackedPostActive?: boolean
  /** Non-null if the channel is being followed */
  channelSubscriptionId?: string | null
  /** Channel username (Telegram) */
  channelUsername?: string | null
  /** Keyword ID for AI reply generation */
  keywordId?: string | null
}

export type CommentData = {
  id: string
  author: { username: string; avatar?: string }
  body: string
  sentiment: Sentiment | null
  relevance: number | null
  createdAt: Date
  postUrl: string | null
  replies: CommentData[]
  isOwn: boolean
  isAuto: boolean
  isDeleted: boolean
  isPending: boolean
  reactions: { emoji: string; count: number }[]
}
