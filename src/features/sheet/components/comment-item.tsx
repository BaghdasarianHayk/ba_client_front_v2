import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Angry,
  Blend,
  Check,
  ExternalLink,
  Link2,
  Loader2,
  MessageCircleQuestion,
  MessageSquare,
  Meh,
  MinusCircle,
  PlusCircle,
  Smile,
  SmilePlus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { type PlatformId } from '@/components/platform-icon'
import { PosterService, POSTER_TASK_COMPLETED_EVENT, type PosterPlatform } from '@/services/api/poster-service'
import { useViewerMode } from '@/hooks/use-viewer-mode'
import { type CommentData } from '../types'
import { CommentRouter } from './comment-router'
import { ReplyCompose, type ThreadComment } from './reply-compose'

// ─── Sentiment config ────────────────────────────────────────────────────────
const sentimentConfig = {
  positive: {
    label: 'Positive',
    icon: Smile,
    className:
      'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  },
  neutral: {
    label: 'Neutral',
    icon: Meh,
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  negative: {
    label: 'Negative',
    icon: Angry,
    className:
      'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
  question: {
    label: 'Question',
    icon: MessageCircleQuestion,
    className:
      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
} as const

const availableEmojis = [
  '👍', '👎', '❤️', '🔥', '😂', '😮', '😢', '🎉', '🤔', '👀', '💯', '🙏',
]

// ─── Comment Actions ─────────────────────────────────────────────────────────
function CommentActions({
  relevance,
  sentimentKey,
  postUrl,
  isTelegram,
  isOwn,
  isDeleted,
  readOnly,
  onReplyClick,
  onReaction,
  onDelete,
}: {
  relevance: number
  sentimentKey: string | null
  postUrl: string | null
  isTelegram: boolean
  isOwn?: boolean
  isDeleted?: boolean
  readOnly?: boolean
  onReplyClick: () => void
  onReaction?: (emoji: string) => void
  onDelete?: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!postUrl) return
    try {
      await navigator.clipboard.writeText(postUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* noop */
    }
  }

  return (
    <>
      {/* Reply — Telegram only, editors only */}
      {isTelegram && !isDeleted && !readOnly && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='h-6 gap-1 rounded-full px-2 text-[11px] text-muted-foreground'
              onClick={onReplyClick}
            >
              <MessageSquare className='!size-3.5' />
              Reply
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reply to this comment</TooltipContent>
        </Tooltip>
      )}

      {/* Sentiment icon */}
      {isTelegram && sentimentKey && sentimentConfig[sentimentKey as keyof typeof sentimentConfig] && (() => {
        const s = sentimentConfig[sentimentKey as keyof typeof sentimentConfig]
        const SIcon = s.icon
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn('flex items-center rounded-full px-1.5 py-0.5', s.className.split(' ').filter(c => c.startsWith('text-')).join(' '))}>
                <SIcon className='size-3.5' />
              </div>
            </TooltipTrigger>
            <TooltipContent>{s.label}</TooltipContent>
          </Tooltip>
        )
      })()}

      {/* Relevance — Telegram only (other platforms return null) */}
      {isTelegram && relevance > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] text-muted-foreground'>
              <Blend className='size-3.5' />
              <span>{relevance}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Relevance</TooltipContent>
        </Tooltip>
      )}

      {/* Copy link */}
      {!isDeleted && postUrl && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-6 rounded-full text-muted-foreground'
              onClick={handleCopy}
            >
              {copied ? (
                <Check className='!size-3.5 text-green-500' />
              ) : (
                <Link2 className='!size-3.5' />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copied ? 'Copied!' : 'Copy link'}</TooltipContent>
        </Tooltip>
      )}

      {/* Open original */}
      {!isDeleted && postUrl && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-6 rounded-full text-muted-foreground'
              onClick={() =>
                window.open(postUrl, '_blank', 'noopener,noreferrer')
              }
            >
              <ExternalLink className='!size-3.5' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open original</TooltipContent>
        </Tooltip>
      )}

      {/* Delete — Telegram only, own comments only, editors only */}
      {isTelegram && isOwn && !isDeleted && !readOnly && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-6 rounded-full text-muted-foreground hover:text-red-500'
              onClick={onDelete}
            >
              <Trash2 className='!size-3.5' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete comment</TooltipContent>
        </Tooltip>
      )}

      {/* Emoji picker — Telegram only, editors only */}
      {isTelegram && !isDeleted && !readOnly && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-6 rounded-full text-muted-foreground'
            >
              <SmilePlus className='!size-3.5' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-2' align='start'>
            <ScrollArea className='max-h-40'>
              <div className='flex max-w-[200px] flex-wrap gap-1'>
                {availableEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type='button'
                    className='cursor-pointer rounded p-1.5 text-lg hover:bg-muted'
                    onClick={() => onReaction?.(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}
    </>
  )
}

// ─── CommentItem ─────────────────────────────────────────────────────────────
type CommentItemProps = {
  comment: CommentData
  /** Platform of the parent mention — gates Telegram-only features */
  platform: PlatformId
  /** Auto-expand replies when sentiment filter is active */
  autoExpand?: boolean
  /** Project ID for AI reply generation */
  projectId?: string
  /** Keyword ID for AI reply generation */
  keywordId?: string
  /** Ancestor comment chain for context-aware AI replies */
  ancestorThread?: ThreadComment[]
}

export function CommentItem({ comment, platform, autoExpand = false, projectId, keywordId, ancestorThread = [] }: CommentItemProps) {
  const { canEdit } = useViewerMode()
  const timeAgo = formatDistanceToNow(comment.createdAt, { addSuffix: true })
  const hasReplies = comment.replies.length > 0

  const [repliesOpen, setRepliesOpen] = useState(autoExpand && hasReplies)
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [pendingReplyText, setPendingReplyText] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [optimisticallyDeleted, setOptimisticallyDeleted] = useState(false)

  // Auto-expand when sentiment filter activates
  useEffect(() => {
    if (autoExpand && hasReplies) setRepliesOpen(true)
  }, [autoExpand, hasReplies])

  // Clear pending reply when poster task completes
  useEffect(() => {
    if (!pendingReplyText) return
    const handler = () => setPendingReplyText(null)
    window.addEventListener(POSTER_TASK_COMPLETED_EVENT, handler)
    return () => window.removeEventListener(POSTER_TASK_COMPLETED_EVENT, handler)
  }, [pendingReplyText])

  const isTelegram = platform === 'telegram'

  // ── Poster handlers ────────────────────────────────────────────────────────
  const handleReplySend = useCallback(
    async (text: string) => {
      if (!isTelegram || !comment.postUrl) throw new Error('Reply not supported')
      await PosterService.reply(platform as PosterPlatform, {
        telegram_url: comment.postUrl,
        reply_text: text,
      })
      // Show optimistic pending placeholder
      setPendingReplyText(text)
    },
    [platform, comment.postUrl, isTelegram]
  )

  const handleReaction = useCallback(
    async (emoji: string) => {
      if (!isTelegram || !comment.postUrl) return
      try {
        await PosterService.setReaction(platform as PosterPlatform, {
          telegram_url: comment.postUrl,
          reaction: emoji,
        })
      } catch (err: any) {
        toast.error(err.detail || err.message || 'Failed to set reaction')
      }
    },
    [platform, comment.postUrl, isTelegram]
  )

  const handleDelete = useCallback(async () => {
    if (!isTelegram || !comment.postUrl) return
    setDeleting(true)
    try {
      await PosterService.deleteComment(platform as PosterPlatform, {
        telegram_url: comment.postUrl,
      })
      // Optimistically hide the comment immediately
      setOptimisticallyDeleted(true)
      setDeleteConfirmOpen(false)
      toast.success('Comment deleted')
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }, [platform, comment.postUrl, isTelegram])

  const bodyRefCallback = useCallback((node: HTMLParagraphElement | null) => {
    if (node) setClamped(node.scrollHeight > node.clientHeight + 1)
  }, [])

  const relevance = comment.relevance ?? 0
  const isOwn = comment.isOwn
  const isAuto = comment.isAuto
  const isDeleted = comment.isDeleted
  const isPending = comment.isPending
  const reactions = comment.reactions

  // ── Optimistically deleted — hide from tree with fade-out ──────────────────
  if (optimisticallyDeleted) {
    return null
  }

  // ── Pending state ──────────────────────────────────────────────────────────
  if (isPending) {
    return (
      <div className='mt-2 flex w-full items-center gap-2 opacity-50'>
        <CommentRouter className='text-border' />
        <div className='flex items-center gap-2'>
          <img
            src='/images/brand_advocate_logo.png'
            alt='Bot'
            className='size-5 rounded-sm'
          />
          <span className='animate-pulse text-sm text-muted-foreground'>
            Bot reply sending…
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('mt-2 flex w-full flex-col', isDeleted && 'opacity-50')}
    >
      {/* Author row */}
      <div className='mb-1 flex items-center'>
        <div className='flex items-center gap-1'>
          <CommentRouter className='text-border' />

          {/* Bot logo or user avatar */}
          {isOwn ? (
            <img
              src='/images/brand_advocate_logo.png'
              alt='Bot'
              className='size-5 rounded-sm'
            />
          ) : (
            <Avatar className='size-5'>
              <AvatarImage
                src={comment.author.avatar}
                alt={comment.author.username}
              />
              <AvatarFallback className='text-[9px]'>
                {comment.author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}

          <span className='cursor-pointer text-sm font-medium text-foreground hover:underline'>
            {comment.author.username}
          </span>
          <span className='text-xs text-muted-foreground'>•</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='cursor-default text-xs text-muted-foreground'>
                {timeAgo}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {comment.createdAt.toLocaleString()}
            </TooltipContent>
          </Tooltip>

          {/* Deleted badge */}
          {isDeleted && (
            <>
              <span className='text-xs text-muted-foreground'>•</span>
              <Badge
                variant='outline'
                className='gap-0.5 rounded-full border-red-500/30 bg-red-500/10 px-1.5 py-0 text-[10px] text-red-600 dark:text-red-400'
              >
                Deleted
              </Badge>
            </>
          )}

          {/* Auto / Manual badge for own comments */}
          {isOwn && !isDeleted && (
            <>
              <span className='text-xs text-muted-foreground'>•</span>
              <Badge
                variant='outline'
                className={cn(
                  'rounded-full px-1.5 py-0 text-[10px] font-medium',
                  isAuto
                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'
                )}
              >
                {isAuto ? 'auto' : 'manual'}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      {hasReplies ? (
        <>
          {/* Body with separator */}
          <div className='mb-1 flex w-full ps-4'>
            <div className='flex gap-2'>
              <div className='flex w-2.5 shrink-0 justify-end'>
                <Separator orientation='vertical' />
              </div>
              <div className='mb-1 flex w-full flex-col gap-1'>
                <p
                  ref={!expanded ? bodyRefCallback : undefined}
                  className={cn(
                    'whitespace-pre-line text-sm leading-relaxed text-muted-foreground',
                    !expanded && 'line-clamp-3'
                  )}
                >
                  {comment.body}
                </p>
                {clamped && (
                  <button
                    type='button'
                    onClick={() => setExpanded(!expanded)}
                    className='w-fit text-sm font-semibold text-foreground hover:underline'
                  >
                    {expanded ? 'less' : 'more'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Actions row */}
          <div className='mb-1 flex flex-wrap items-center gap-1 ps-4.5'>
            <button
              type='button'
              className='cursor-pointer text-muted-foreground hover:text-foreground'
              onClick={() => setRepliesOpen(!repliesOpen)}
            >
              {repliesOpen ? (
                <MinusCircle className='size-4' />
              ) : (
                <PlusCircle className='size-4' />
              )}
            </button>
            <button
              type='button'
              className='cursor-pointer text-xs text-muted-foreground hover:text-foreground hover:underline'
              onClick={() => setRepliesOpen(!repliesOpen)}
            >
              {comment.replies.length}{' '}
              {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
            <CommentActions
              relevance={relevance}
              sentimentKey={comment.sentiment}
              postUrl={comment.postUrl}
              isTelegram={isTelegram}
              isOwn={isOwn}
              isDeleted={isDeleted}
              readOnly={!canEdit}
              onReplyClick={() => setReplyOpen(!replyOpen)}
              onReaction={handleReaction}
              onDelete={() => setDeleteConfirmOpen(true)}
            />

            {/* Inline reactions */}
            {isTelegram && reactions.length > 0 && (
              <>
                <Separator
                  orientation='vertical'
                  className='mx-0.5 h-4 self-center'
                />
                {reactions.map((r, i) => (
                  <div
                    key={i}
                    className='flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-xs'
                  >
                    <span>{r.emoji}</span>
                    <span className='text-muted-foreground'>{r.count}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Reply input — connected with router line */}
          {replyOpen && (
            <div className='flex ps-4'>
              <div className='flex w-2.5 shrink-0 justify-end'>
                <Separator orientation='vertical' />
              </div>
              <div className='mt-2 flex w-full items-start gap-1'>
                <CommentRouter className='mt-1 shrink-0 text-border' />
                <ReplyCompose
                  onClose={() => setReplyOpen(false)}
                  className='flex-1'
                  projectId={projectId}
                  commentBody={comment.body}
                  keywordId={keywordId}
                  commentThread={[...ancestorThread, { comment: comment.body, is_target: true }]}
                  onSend={handleReplySend}
                />
              </div>
            </div>
          )}

          {/* Replies tree */}
          {repliesOpen && (
            <div className='flex ps-4'>
              <div className='flex w-2.5 shrink-0 justify-end'>
                <Separator orientation='vertical' />
              </div>
              <div className='flex w-full flex-col'>
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} platform={platform} autoExpand={autoExpand} projectId={projectId} keywordId={keywordId} ancestorThread={[...ancestorThread, { comment: comment.body, is_target: false }]} />
                ))}
                {pendingReplyText && (
                  <PendingCommentPlaceholder text={pendingReplyText} isReply />
                )}
              </div>
            </div>
          )}
          {/* Pending reply when replies section is closed */}
          {!repliesOpen && pendingReplyText && (
            <div className='flex ps-4'>
              <div className='flex w-2.5 shrink-0 justify-end'>
                <Separator orientation='vertical' />
              </div>
              <div className='flex w-full flex-col'>
                <PendingCommentPlaceholder text={pendingReplyText} isReply />
              </div>
            </div>
          )}
        </>
      ) : (
        /* No replies */
        <>
          <div className='flex w-full ps-4'>
            <div className='flex gap-2'>
              <div className={cn('w-2.5 shrink-0', replyOpen && 'flex justify-end')}>
                {replyOpen && <Separator orientation='vertical' />}
              </div>
              <div className='mb-1 flex w-full flex-col gap-1'>
                <p
                  ref={!expanded ? bodyRefCallback : undefined}
                  className={cn(
                    'whitespace-pre-line text-sm leading-relaxed text-muted-foreground',
                    !expanded && 'line-clamp-3'
                  )}
                >
                  {comment.body}
                </p>
                {clamped && (
                  <button
                    type='button'
                    onClick={() => setExpanded(!expanded)}
                    className='w-fit text-sm font-semibold text-foreground hover:underline'
                  >
                    {expanded ? 'less' : 'more'}
                  </button>
                )}

                {/* Actions inline inside the same column so separator is continuous */}
                <div className='flex flex-wrap items-center gap-1'>
                  <CommentActions
                    relevance={relevance}
                    sentimentKey={comment.sentiment}
                    postUrl={comment.postUrl}
                    isTelegram={isTelegram}
                    isOwn={isOwn}
                    isDeleted={isDeleted}
                    readOnly={!canEdit}
                    onReplyClick={() => setReplyOpen(!replyOpen)}
                    onReaction={handleReaction}
                    onDelete={() => setDeleteConfirmOpen(true)}
                  />

                  {/* Inline reactions */}
                  {isTelegram && reactions.length > 0 && (
                    <>
                      <Separator
                        orientation='vertical'
                        className='mx-0.5 h-4 self-center'
                      />
                      {reactions.map((r, i) => (
                        <div
                          key={i}
                          className='flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-xs'
                        >
                          <span>{r.emoji}</span>
                          <span className='text-muted-foreground'>{r.count}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reply input — separator continues from body above */}
          {replyOpen && (
            <div className='flex ps-4'>
              <div className='flex w-2.5 shrink-0 justify-end'>
                <Separator orientation='vertical' />
              </div>
              <div className='mt-1 flex w-full items-start gap-1'>
                <CommentRouter className='mt-1 shrink-0 text-border' />
                <ReplyCompose
                  onClose={() => setReplyOpen(false)}
                  className='flex-1'
                  projectId={projectId}
                  commentBody={comment.body}
                  keywordId={keywordId}
                  commentThread={[...ancestorThread, { comment: comment.body, is_target: true }]}
                  onSend={handleReplySend}
                />
              </div>
            </div>
          )}
          {/* Pending reply placeholder for leaf comments */}
          {pendingReplyText && (
            <div className='flex ps-4'>
              <div className='flex w-2.5 shrink-0 justify-end'>
                <Separator orientation='vertical' />
              </div>
              <div className='flex w-full flex-col'>
                <PendingCommentPlaceholder text={pendingReplyText} isReply />
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your comment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleting && <Loader2 className='mr-1 size-3.5 animate-spin' />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── PendingCommentPlaceholder ────────────────────────────────────────────────
/**
 * Optimistic placeholder shown in the comment tree while a comment/reply
 * is being processed by the poster service. Styled to match the tree layout.
 */
function PendingCommentPlaceholder({ text, isReply = false }: { text: string; isReply?: boolean }) {
  return (
    <div className={cn('mt-2 flex w-full flex-col', isReply && 'ps-4')}>
      <div className='mb-1 flex items-center'>
        <div className='flex items-center gap-1'>
          <CommentRouter className='text-border' />
          <img
            src='/images/brand_advocate_logo.png'
            alt='Bot'
            className='size-5 rounded-sm'
          />
          <span className='text-sm font-medium text-foreground/70'>You</span>
          <span className='text-xs text-muted-foreground'>•</span>
          <span className='flex items-center gap-1 text-xs text-orange-500'>
            <Loader2 className='size-3 animate-spin' />
            Publishing…
          </span>
        </div>
      </div>
      <div className='flex w-full ps-4'>
        <div className='flex gap-2'>
          <div className='w-2.5 shrink-0' />
          <p className='animate-pulse whitespace-pre-line text-sm leading-relaxed text-muted-foreground/60 line-clamp-3'>
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── CommentsTree ────────────────────────────────────────────────────────────
type CommentsTreeProps = {
  postId: string
  comments: CommentData[]
  platform: PlatformId
  selectedSentiments: Set<import('../types').Sentiment>
  replyOpen?: boolean
  onReplyClose?: () => void
  /** Project ID for AI reply generation */
  projectId?: string
  /** Keyword ID for AI reply generation */
  keywordId?: string
  /** Post body content for top-level AI reply generation */
  postBody?: string
  /** Mention ID for sending top-level comments */
  mentionId?: string
  /** Pending comment texts (managed by parent PostCard) */
  pendingTexts?: string[]
  /** Callback when a comment is successfully sent (to add optimistic placeholder) */
  onCommentSent?: (text: string) => void
}

/**
 * Recursively filter comments by sentiment.
 * Preserves tree structure: a parent is kept if any descendant matches.
 * Own comments (isOwn) are always kept regardless of filter.
 */
function filterBySentiment(
  comments: CommentData[],
  sentiments: Set<string>
): CommentData[] {
  if (sentiments.size === 0) return comments

  return comments.reduce<CommentData[]>((acc, comment) => {
    const filteredReplies = filterBySentiment(comment.replies, sentiments)
    const matches =
      comment.isOwn ||
      (comment.sentiment !== null && sentiments.has(comment.sentiment)) ||
      filteredReplies.length > 0

    if (matches) {
      acc.push({ ...comment, replies: filteredReplies })
    }
    return acc
  }, [])
}

export function CommentsTree({
  comments,
  platform,
  selectedSentiments,
  replyOpen,
  onReplyClose,
  projectId,
  keywordId,
  postBody,
  mentionId,
  pendingTexts = [],
  onCommentSent,
}: CommentsTreeProps) {
  const [showAll, setShowAll] = useState(false)
  const filtered = filterBySentiment(comments, selectedSentiments)

  // Default view: top-N most relevant root comments + own comments.
  // When sentiment filter is active or user clicked "Show all", show everything.
  const TOP_N = 5
  const displayComments = useMemo(() => {
    if (showAll || selectedSentiments.size > 0) return filtered

    // Separate own comments (always shown) from others
    const own = filtered.filter((c) => c.isOwn)
    const others = filtered.filter((c) => !c.isOwn)

    // Sort others by relevance descending, take top N
    const topOthers = [...others]
      .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0))
      .slice(0, TOP_N)

    return [...own, ...topOthers]
  }, [filtered, showAll, selectedSentiments])

  const hasMore = !showAll && selectedSentiments.size === 0 && filtered.length > displayComments.length

  const handlePostCommentSend = useCallback(
    async (text: string) => {
      if (!mentionId) throw new Error('Cannot send: no mention ID')
      await PosterService.createComment(platform as PosterPlatform, {
        content: text,
        mention_id: mentionId,
      })
      // Notify parent to show optimistic pending placeholder
      onCommentSent?.(text)
    },
    [platform, mentionId, onCommentSent]
  )

  return (
    <div className='w-full rounded-b-2xl rounded-r-2xl bg-muted/60 p-1.5 pl-1.5 pt-0'>
      {/* Top separator stub */}
      <div className='flex'>
        <div className='flex h-2.5 w-2.5 shrink-0 justify-end'>
          <Separator orientation='vertical' />
        </div>
      </div>

      {/* Comments */}
      <div className='flex'>
        <div className='flex w-2.5 shrink-0 justify-end'>
          <Separator orientation='vertical' />
        </div>
        <div className='flex w-full flex-col'>
          {/* Post reply — first item */}
          {replyOpen && onReplyClose && (
            <div className='mt-2 flex w-full items-start gap-1'>
              <CommentRouter className='mt-1 shrink-0 text-border' />
              <ReplyCompose
                onClose={onReplyClose}
                placeholder='Write a comment…'
                variant='post'
                className='flex-1'
                projectId={projectId}
                commentBody={postBody}
                keywordId={keywordId}
                onSend={handlePostCommentSend}
              />
            </div>
          )}
          {displayComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} platform={platform} autoExpand={selectedSentiments.size > 0} projectId={projectId} keywordId={keywordId} />
          ))}
          {/* Optimistic pending comments — shown until poster task completes */}
          {pendingTexts.map((text, i) => (
            <PendingCommentPlaceholder key={`pending-${i}`} text={text} />
          ))}
          {hasMore && (
            <button
              type='button'
              onClick={() => setShowAll(true)}
              className='mt-1.5 flex items-center gap-1 ps-1 text-xs font-medium text-primary hover:underline'
            >
              <PlusCircle className='size-3.5' />
              Show all {filtered.length} comments
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
