import { useCallback, useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  Angry,
  Check,
  ExternalLink,
  Link2,
  MessageCircleQuestion,
  MessageSquare,
  Megaphone,
  Meh,
  MinusCircle,
  PlusCircle,
  Smile,
  SmilePlus,
  Sparkles,
  SquaresIntersect,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PlatformIcon } from '@/components/platform-icon'
import { PosterService, POSTER_TASK_COMPLETED_EVENT, type PosterPlatform } from '@/services/api/poster-service'
import { highlightKeyword } from '@/lib/highlight'
import { useViewerMode } from '@/hooks/use-viewer-mode'
import { type PostData, type Sentiment } from '../types'
import { CommentsTree } from './comment-item'

// ─── Sentiment config ────────────────────────────────────────────────────────
const sentimentConfig = {
  positive: {
    label: 'Positive',
    icon: Smile,
    iconColor: 'text-green-600 dark:text-green-400',
    className:
      'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  },
  neutral: {
    label: 'Neutral',
    icon: Meh,
    iconColor: 'text-amber-600 dark:text-amber-400',
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  negative: {
    label: 'Negative',
    icon: Angry,
    iconColor: 'text-red-600 dark:text-red-400',
    className:
      'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
  question: {
    label: 'Question',
    icon: MessageCircleQuestion,
    iconColor: 'text-purple-600 dark:text-purple-400',
    className:
      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
} as const

// ─── Types ───────────────────────────────────────────────────────────────────
type PostCardProps = {
  post: PostData
  /** Override tracked post ID (used by tracked posts page). Falls back to post.trackedPostId */
  trackedPostId?: string
  /** Callback to lazy-load comments for tracked posts */
  onLoadComments?: () => void
  /** Project ID for AI reply generation */
  projectId?: string
  /** Keyword ID for AI reply generation */
  keywordId?: string
}

// ─── PostCard ────────────────────────────────────────────────────────────────
export function PostCard({ post, trackedPostId: trackedPostIdProp, onLoadComments, projectId, keywordId }: PostCardProps) {
  const navigate = useNavigate()
  const { canEdit } = useViewerMode()
  const trackedPostId = trackedPostIdProp ?? post.trackedPostId ?? null
  const timeAgo = formatDistanceToNow(post.createdAt, { addSuffix: true })
  const sentiment = sentimentConfig[post.sentiment]
  const SentimentIcon = sentiment.icon

  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const [copied, setCopied] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(post.comments.length > 0)
  const [replyOpen, setReplyOpen] = useState(false)
  const [selectedSentiments, setSelectedSentiments] = useState<Set<Sentiment>>(new Set())
  const [commentsRequested, setCommentsRequested] = useState(false)
  const [pendingComments, setPendingComments] = useState<string[]>([])

  // Auto-fetch comments when section opens and none are loaded
  const handleToggleComments = useCallback(() => {
    setCommentsOpen((prev) => {
      const next = !prev
      if (next && post.comments.length === 0 && !commentsRequested && onLoadComments) {
        setCommentsRequested(true)
        onLoadComments()
      }
      return next
    })
  }, [post.comments.length, commentsRequested, onLoadComments])

  const bodyRefCallback = useCallback((node: HTMLParagraphElement | null) => {
    if (node) setClamped(node.scrollHeight > node.clientHeight + 1)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.postUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* noop */
    }
  }

  const handleOpen = () =>
    window.open(post.postUrl, '_blank', 'noopener,noreferrer')

  const handlePostReaction = useCallback(
    async (emoji: string) => {
      if (post.platform !== 'telegram') return
      try {
        await PosterService.setReaction(post.platform as PosterPlatform, {
          telegram_url: post.postUrl,
          reaction: emoji,
        })
      } catch (err: any) {
        toast.error(err.detail || err.message || 'Failed to set reaction')
      }
    },
    [post.platform, post.postUrl]
  )

  // Callback passed to CommentsTree — adds optimistic pending comment
  const handleCommentSent = useCallback((text: string) => {
    setPendingComments((prev) => [...prev, text])
    // Auto-open comments section so user sees the placeholder
    if (!commentsOpen) setCommentsOpen(true)
  }, [commentsOpen])

  // Clear pending placeholders when poster task completes
  useEffect(() => {
    if (pendingComments.length === 0) return
    const handler = () => setPendingComments([])
    window.addEventListener(POSTER_TASK_COMPLETED_EVENT, handler)
    return () => window.removeEventListener(POSTER_TASK_COMPLETED_EVENT, handler)
  }, [pendingComments.length])

  return (
    <Card
      className={cn(
        'gap-0 border-none bg-transparent py-0 shadow-none',
        post.isDeleted && 'opacity-50'
      )}
    >
      <CardHeader className='gap-0 px-0 pb-1'>
        {/* Meta row */}
        <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
          <PlatformIcon platform={post.platform} size='md' />

          <span className='cursor-pointer font-semibold text-foreground hover:underline'>
            {post.author.username}
          </span>

          {/* Follow / Following — Telegram channels only */}
          {post.platform === 'telegram' && (post.channelUsername || post.author.username) && (
            <>
              <span>•</span>
              {post.channelSubscriptionId ? (
                <button
                  type='button'
                  className='inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400'
                  onClick={() =>
                    navigate({
                      to: `/followings/${post.channelSubscriptionId}/settings`,
                    })
                  }
                >
                  Following
                </button>
              ) : canEdit ? (
                <Button
                  size='sm'
                  className='h-5 rounded-full bg-blue-600 px-2 text-[11px] font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                  onClick={() =>
                    navigate({
                      to: '/followings/new',
                      search: { username: post.channelUsername || post.author.username },
                    })
                  }
                >
                  Follow
                </Button>
              ) : null}
            </>
          )}

          {post.reasons.map((reason, i) => (
            <span key={i} className='flex items-center gap-2'>
              <span>•</span>
              {reason.type === 'following' ? (
                <span className='cursor-pointer font-medium text-blue-600 hover:underline dark:text-blue-400'>
                  Following
                </span>
              ) : (
                <span className='cursor-pointer font-medium text-blue-600 hover:underline dark:text-blue-400'>
                  {reason.keyword}
                </span>
              )}
            </span>
          ))}

          <span>•</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='cursor-default'>{timeAgo}</span>
            </TooltipTrigger>
            <TooltipContent>{post.createdAt.toLocaleString()}</TooltipContent>
          </Tooltip>

          {/* Status badges */}
          {post.isDeleted && (
            <>
              <span>•</span>
              <Badge
                variant='outline'
                className='gap-1 rounded-full border-red-500/30 bg-red-500/10 px-1.5 py-0 text-[10px] font-medium text-red-600 dark:text-red-400'
              >
                <Trash2 className='!size-3' />
                Deleted
              </Badge>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className='px-0 pb-2 pt-1'>
        {/* Title */}
        <div className='flex flex-wrap items-center gap-2'>
          <h3 className='text-base font-semibold leading-snug tracking-tight'>
            {post.title}
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Sparkles className='size-3.5 text-purple-500' />
            </TooltipTrigger>
            <TooltipContent>AI Summary</TooltipContent>
          </Tooltip>
        </div>

        {/* Body preview */}
        <div className='mt-1.5'>
          <p
            ref={!expanded ? bodyRefCallback : undefined}
            className={cn(
              'text-sm leading-relaxed text-muted-foreground whitespace-pre-line',
              !expanded && 'line-clamp-3'
            )}
            dangerouslySetInnerHTML={{
              __html: highlightKeyword(
                post.body,
                post.reasons.find((r) => r.type === 'keyword')?.keyword
              ),
            }}
          />
          {clamped && (
            <button
              type='button'
              onClick={() => setExpanded(!expanded)}
              className='mt-1 text-sm font-semibold text-foreground hover:underline'
            >
              {expanded ? 'less' : 'more'}
            </button>
          )}
        </div>
      </CardContent>

      <CardFooter className='flex-col gap-1.5 px-0 pt-0'>
        {/* Post info row: relevance, reach score, links, emoji */}
        <div className='no-scrollbar flex w-full min-w-0 items-center gap-1 overflow-x-auto'>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn('flex items-center rounded-full px-2 py-1', sentiment.iconColor)}>
                <SentimentIcon className='size-4' />
              </div>
            </TooltipTrigger>
            <TooltipContent>{sentiment.label}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className='flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted-foreground'>
                <SquaresIntersect className='size-4' />
                <span>{post.relevance}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Relevance</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className='flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted-foreground'>
                <Megaphone className='size-4' />
                <span>{formatCount(post.unifiedScore)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Reach Score</TooltipContent>
          </Tooltip>

          <Separator orientation='vertical' className='mx-0.5 h-5 self-center' />

          {/* Copy link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='size-8 rounded-full text-muted-foreground'
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className='!size-4 text-green-500' />
                ) : (
                  <Link2 className='!size-4' />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? 'Copied!' : 'Copy link'}</TooltipContent>
          </Tooltip>

          {/* Open in new tab */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='size-8 rounded-full text-muted-foreground'
                onClick={handleOpen}
              >
                <ExternalLink className='!size-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open original</TooltipContent>
          </Tooltip>

          {/* Emoji picker — Telegram only */}
          {post.platform === 'telegram' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-8 rounded-full text-muted-foreground'
                  disabled={post.isDeleted || !canEdit}
                >
                  <SmilePlus className='!size-4' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-2' align='start'>
                <ScrollArea className='max-h-40'>
                  <div className='flex max-w-[200px] flex-wrap gap-1'>
                    {post.availableEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type='button'
                        className='cursor-pointer rounded p-1.5 text-lg hover:bg-muted'
                        onClick={() => handlePostReaction(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Comments & reply row */}
        <div className='no-scrollbar flex w-full min-w-0 items-center gap-1 overflow-x-auto'>
          <CommentFilter
            post={post}
            commentsOpen={commentsOpen}
            onToggleComments={handleToggleComments}
            selectedSentiments={selectedSentiments}
            onToggleSentiment={(key) => {
              setSelectedSentiments((prev) => {
                const next = new Set(prev)
                if (next.has(key)) next.delete(key)
                else {
                  next.add(key)
                  if (next.size === 4) return new Set()
                }
                return next
              })
            }}
          />

          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'gap-1.5 rounded-full text-xs',
              replyOpen
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground'
            )}
            disabled={!post.commentable || post.isDeleted || !canEdit}
            onClick={() => {
              setReplyOpen((v) => !v)
              if (!commentsOpen) {
                setCommentsOpen(true)
                if (post.comments.length === 0 && !commentsRequested && onLoadComments) {
                  setCommentsRequested(true)
                  onLoadComments()
                }
              }
            }}
          >
            <MessageSquare className='!size-4' />
            {!post.commentable ? 'Not commentable' : 'Reply'}
          </Button>

          <Separator orientation='vertical' className='mx-0.5 h-5 self-center' />

          {trackedPostId ? (
            // Tracked — show status indicator + settings link
            <Button
              size='sm'
              variant='outline'
              className='h-5 gap-1.5 rounded-full px-2 text-[11px] font-medium'
              onClick={() =>
                navigate({
                  to: `/tracked-posts/${trackedPostId}/settings`,
                })
              }
            >
              {post.trackedPostActive === true ? (
                // Active — green pulsing dot
                <span className='relative inline-flex size-2'>
                  <span className='absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75' />
                  <span className='relative inline-flex size-2 rounded-full bg-green-500' />
                </span>
              ) : post.trackedPostActive === false ? (
                // Inactive — orange static dot
                <span className='inline-flex size-2 rounded-full bg-orange-400' />
              ) : (
                // Unknown — gray dot
                <span className='inline-flex size-2 rounded-full bg-muted-foreground/50' />
              )}
              Tracking
            </Button>
          ) : canEdit ? (
            // Not tracked — blue pill (only for editors/owners)
            <Button
              size='sm'
              className='h-5 rounded-full bg-blue-600 px-2 text-[11px] font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              onClick={() =>
                navigate({
                  to: '/tracked-posts/new',
                  search: { url: post.postUrl },
                })
              }
            >
              Track Post
            </Button>
          ) : null}
        </div>
      </CardFooter>

      {commentsOpen && (post.comments.length > 0 || replyOpen || pendingComments.length > 0) && (
        <CommentsTree
          postId={post.id}
          comments={post.comments}
          platform={post.platform}
          selectedSentiments={selectedSentiments}
          replyOpen={replyOpen}
          onReplyClose={() => setReplyOpen(false)}
          projectId={projectId}
          keywordId={keywordId}
          postBody={post.body}
          mentionId={post.id}
          pendingTexts={pendingComments}
          onCommentSent={handleCommentSent}
        />
      )}
    </Card>
  )
}

// ─── Comment filter (sentiment pills) ───────────────────────────────────────
const sentimentFilters: {
  key: Sentiment
  icon: React.ElementType
  activeColor: string
  activeBg: string
  label: string
}[] = [
  {
    key: 'positive',
    icon: Smile,
    activeColor: 'text-green-600 dark:text-green-400',
    activeBg: 'bg-green-500/15',
    label: 'Positive',
  },
  {
    key: 'neutral',
    icon: Meh,
    activeColor: 'text-amber-600 dark:text-amber-400',
    activeBg: 'bg-amber-500/15',
    label: 'Neutral',
  },
  {
    key: 'negative',
    icon: Angry,
    activeColor: 'text-red-600 dark:text-red-400',
    activeBg: 'bg-red-500/15',
    label: 'Negative',
  },
  {
    key: 'question',
    icon: MessageCircleQuestion,
    activeColor: 'text-purple-600 dark:text-purple-400',
    activeBg: 'bg-purple-500/15',
    label: 'Question',
  },
]

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return n.toString()
}

function formatBadge(n: number): string {
  if (n > 99) return '99+'
  return n.toString()
}

function CommentFilter({
  post,
  commentsOpen,
  onToggleComments,
  selectedSentiments,
  onToggleSentiment,
}: {
  post: PostData
  commentsOpen: boolean
  onToggleComments: () => void
  selectedSentiments: Set<Sentiment>
  onToggleSentiment: (key: Sentiment) => void
}) {
  const allSelected = selectedSentiments.size === 0 || selectedSentiments.size === 4

  return (
    <div className={cn(
      'relative flex items-center gap-1 bg-muted/60 p-1',
      commentsOpen ? 'rounded-t-2xl' : 'rounded-full'
    )}>
      {commentsOpen && (
        <div
          className='pointer-events-none absolute -end-4 top-1/2 h-1/2 aspect-square bg-muted/60'
          style={{
            mask: 'radial-gradient(circle at top right, transparent 70%, black 71%)',
            WebkitMask:
              'radial-gradient(circle at top right, transparent 70%, black 71%)',
          }}
        />
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'h-6 gap-1 rounded-full !px-0.5 text-xs font-medium',
              allSelected ? 'text-foreground' : 'text-muted-foreground'
            )}
            onClick={onToggleComments}
          >
            {commentsOpen ? (
              <MinusCircle className='!size-[18px]' />
            ) : (
              <PlusCircle className='!size-[18px]' />
            )}
            <span>{formatCount(post.commentCount)}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {commentsOpen ? 'Hide comments' : 'Show comments'}
        </TooltipContent>
      </Tooltip>

      {/* Desktop: inline count — show when there are comments */}
      {post.commentCount > 0 && (
      <div className='hidden items-center gap-0.5 sm:flex'>
        {sentimentFilters.map(
          ({ key, icon: Icon, activeColor, activeBg, label }) => {
            const isActive = selectedSentiments.has(key)
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className={cn(
                      'h-6 gap-0.5 rounded-full !pl-1 !pr-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? cn(activeColor, activeBg)
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => onToggleSentiment(key)}
                  >
                    <Icon className='!size-[18px]' />
                    <span>{formatCount(post.commentSentiments[key])}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            )
          }
        )}
      </div>
      )}

      {/* Mobile: badge count — show when there are comments */}
      {post.commentCount > 0 && (
      <div className='flex items-center gap-0.5 sm:hidden'>
        {sentimentFilters.map(
          ({ key, icon: Icon, activeColor, activeBg, label }) => {
            const isActive = selectedSentiments.has(key)
            const count = post.commentSentiments[key]
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div className='relative'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className={cn(
                        'size-6 rounded-full transition-colors',
                        isActive
                          ? cn(activeColor, activeBg)
                          : 'bg-background text-muted-foreground hover:text-foreground'
                      )}
                      onClick={() => onToggleSentiment(key)}
                    >
                      <Icon className='!size-[16px]' />
                    </Button>
                    {count > 0 && (
                      <span
                        className={cn(
                          'absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold leading-none',
                          isActive
                            ? 'bg-foreground text-background'
                            : 'bg-muted-foreground/60 text-background'
                        )}
                      >
                        {formatBadge(count)}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            )
          }
        )}
      </div>
      )}
    </div>
  )
}
