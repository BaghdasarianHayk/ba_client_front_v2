import type { Mention, MentionComment } from '@/services/api/mention-service'
import type { PostData, CommentData } from './types'

function transformComment(c: MentionComment): CommentData {
  const reactions = Object.entries(c.possibleReactions)
    .filter(([, ids]) => ids.length > 0)
    .map(([emoji, ids]) => ({ emoji, count: ids.length }))

  return {
    id: c.id,
    author: {
      username: c.authorName || c.authorUsername || 'Unknown',
    },
    body: c.content,
    sentiment: c.sentiment,
    relevance: c.relevance,
    createdAt: new Date(c.postedAt),
    postUrl: c.postUrl,
    replies: c.replies.map(transformComment),
    isOwn: c.isOurComment,
    isAuto: c.isAuto,
    isDeleted: c.isDeleted,
    isPending: c.isPending,
    reactions,
  }
}

export function mentionToPost(
  m: Mention,
  keywordIdMap?: Map<string, string>,
  postStatusMap?: Map<string, boolean>,
  followingMap?: Map<string, string>
): PostData {
  const trackedPostId = m.postSubscriptionId

  // Resolve channel subscription: API field first, then match by username
  let channelSubId = m.channelSubscriptionId
  const channelUser =
    m.channelUsername || (m.platform === 'telegram' ? m.author : null)
  if (!channelSubId && channelUser && followingMap) {
    channelSubId = followingMap.get(channelUser.toLowerCase()) ?? null
  }

  return {
    id: m.id,
    author: { username: m.author },
    platform: m.platform,
    title: m.summary,
    body: m.content,
    sentiment: m.sentiment,
    reasons: [{ type: 'keyword', keyword: m.keyword, keywordId: keywordIdMap?.get(m.keyword) }],
    unifiedScore: m.unifiedScore,
    relevance: m.relevance,
    commentCount: m.commentCount,
    commentSentiments: m.commentSentiments,
    createdAt: new Date(m.postedAt),
    availableEmojis: Object.keys(m.possibleReactions),
    postUrl: m.postUrl,
    isDeleted: m.isDeleted,
    commentable: m.commentable,
    comments: m.comments.map(transformComment),
    trackedPostId,
    trackedPostActive: trackedPostId
      ? postStatusMap?.get(trackedPostId)
      : undefined,
    channelSubscriptionId: channelSubId,
    channelUsername: channelUser,
    keywordId: keywordIdMap?.get(m.keyword) ?? null,
  }
}
