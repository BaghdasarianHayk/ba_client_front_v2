import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import {
  Angry,
  ArrowRight,
  Blend,
  Bot,
  KeyRound,
  Megaphone,
  Meh,
  MessageCircleQuestion,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Radio,
  RefreshCw,
  Rss,
  Smile,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageDescription } from '@/components/page-description'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { PlatformIcon, type PlatformId } from '@/components/platform-icon'
import { useProjectStore } from '@/stores/project-store'
import { KeywordService, type Keyword } from '@/services/api/keyword-service'
import {
  ChannelService,
  type Following,
  type ChannelDetail,
} from '@/services/api/channel-service'
import { PostService, type TrackedPost } from '@/services/api/post-service'
import { MentionService } from '@/services/api/mention-service'
import { ManualCommentDialog } from './components/manual-comment-dialog'
import { useViewerMode } from '@/hooks/use-viewer-mode'

// ─── Sentiment icons ─────────────────────────────────────────────────────────

const SENT = {
  positive: { icon: Smile, color: 'text-green-600 dark:text-green-400' },
  neutral: { icon: Meh, color: 'text-amber-600 dark:text-amber-400' },
  negative: { icon: Angry, color: 'text-red-600 dark:text-red-400' },
  question: { icon: MessageCircleQuestion, color: 'text-purple-600 dark:text-purple-400' },
} as const

type SentimentId = keyof typeof SENT

// ─── Unified row ─────────────────────────────────────────────────────────────

type RowType = 'keyword' | 'following' | 'tracked-post'

interface Row {
  id: string
  type: RowType
  name: string
  subtitle?: string
  platforms: PlatformId[]
  isActive: boolean
  autoReply: null | {
    threshold: number
    scoreThreshold?: number
    countMin?: number
    countMax?: number
  }
  autoReact: null | {
    threshold: number
    sentiments: Partial<Record<SentimentId, 'POSITIVE' | 'NEGATIVE' | null>>
  }
  extra?: string // mentions count, posts count, etc.
  settingsUrl: string
  updatedAt: string
}

const TYPE_META: Record<RowType, { icon: typeof KeyRound; label: string; color: string }> = {
  keyword: { icon: KeyRound, label: 'Keyword', color: 'text-blue-500' },
  following: { icon: Radio, label: 'Channel', color: 'text-emerald-500' },
  'tracked-post': { icon: Rss, label: 'Post', color: 'text-amber-500' },
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function AutoActionsPage() {
  const navigate = useNavigate()
  const { currentProject } = useProjectStore()
  const { canEdit } = useViewerMode()
  const projectId = currentProject?.id

  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [followings, setFollowings] = useState<Following[]>([])
  const [channelDetails, setChannelDetails] = useState<Map<string, ChannelDetail>>(new Map())
  const [trackedPosts, setTrackedPosts] = useState<TrackedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | RowType>('all')
  const [manualCommentOpen, setManualCommentOpen] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      // Fetch stats first for mention counts
      let mentionCounts: Map<string, number> | undefined
      try {
        const stats = await MentionService.getStats(projectId)
        mentionCounts = new Map()
        for (const kw of [...stats.active_keywords, ...stats.inactive_keywords, ...stats.deleted_keywords]) {
          mentionCounts.set(kw.id, kw.count)
        }
      } catch { /* non-critical */ }

      const [kw, ch, tp] = await Promise.all([
        KeywordService.getKeywords(projectId, mentionCounts).catch(() => [] as Keyword[]),
        ChannelService.getChannels(projectId).catch(() => [] as Following[]),
        PostService.getPosts(projectId).then((r) => r.posts).catch(() => [] as TrackedPost[]),
      ])
      setKeywords(kw)
      setFollowings(ch)
      setTrackedPosts(tp)

      // Fetch channel details for auto-action info
      const details = new Map<string, ChannelDetail>()
      await Promise.all(
        ch.map(async (f) => {
          try {
            const d = await ChannelService.getChannel(projectId, f.id)
            details.set(f.id, d)
          } catch { /* skip */ }
        })
      )
      setChannelDetails(details)
    } catch {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const rows = useMemo<Row[]>(() => {
    const r: Row[] = []

    for (const kw of keywords) {
      r.push({
        id: kw.id,
        type: 'keyword',
        name: kw.keyword,
        subtitle: kw.excludedKeywords.length ? `−${kw.excludedKeywords.join(', ')}` : undefined,
        platforms: kw.platforms,
        isActive: kw.isActive,
        autoReply: kw.autoComment.enabled
          ? { threshold: kw.autoComment.threshold, scoreThreshold: kw.autoComment.scoreThreshold, countMin: kw.autoComment.countMin, countMax: kw.autoComment.countMax }
          : null,
        autoReact: kw.autoReact.enabled
          ? { threshold: kw.autoReact.threshold, sentiments: kw.autoReact.sentiments }
          : null,
        extra: `${kw.mentionsCount} mentions`,
        settingsUrl: `/keywords/${kw.id}`,
        updatedAt: kw.updatedAt,
      })
    }

    for (const f of followings) {
      const d = channelDetails.get(f.id)
      r.push({
        id: f.id,
        type: 'following',
        name: `@${f.username}`,
        subtitle: `${f.postsCount} posts`,
        platforms: ['telegram'],
        isActive: f.status === 'active',
        autoReply: d?.autoComment.enabled
          ? { threshold: d.autoComment.threshold, scoreThreshold: d.autoComment.scoreThreshold, countMin: d.autoComment.countMin, countMax: d.autoComment.countMax }
          : null,
        autoReact: d?.autoReact.enabled
          ? { threshold: d.autoReact.threshold, sentiments: d.autoReact.sentiments }
          : null,
        settingsUrl: `/followings/${f.id}/settings`,
        updatedAt: f.lastSync,
      })
    }

    for (const tp of trackedPosts) {
      r.push({
        id: tp.id,
        type: 'tracked-post',
        name: tp.url.replace(/^https?:\/\//, ''),
        subtitle: `${tp.commentCount} comments`,
        platforms: ['telegram'],
        isActive: tp.status === 'active',
        autoReply: tp.autoReply.enabled
          ? { threshold: tp.autoReply.threshold, countMin: tp.autoReply.countMin, countMax: tp.autoReply.countMax }
          : null,
        autoReact: tp.autoReact.enabled
          ? { threshold: tp.autoReact.threshold, sentiments: tp.autoReact.sentiments }
          : null,
        settingsUrl: `/tracked-posts/${tp.id}/settings`,
        updatedAt: tp.createdAt,
      })
    }

    return r
  }, [keywords, followings, channelDetails, trackedPosts])

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.type === filter)
  const counts = { all: rows.length, keyword: 0, following: 0, 'tracked-post': 0 }
  for (const r of rows) counts[r.type]++

  return (
    <>
      <Header fixed>
        <Zap className='size-4 text-muted-foreground' />
        <h1 className='text-sm font-semibold'>
          All Auto Actions
          {!loading && <span className='ml-1 font-normal text-muted-foreground'>{rows.length}</span>}
        </h1>
        <div className='ms-auto flex items-center gap-2'>
          <Button variant='ghost' size='icon' className='size-8' onClick={fetchAll} disabled={loading}>
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          </Button>
          {canEdit && (
            <Button
              variant='outline'
              size='sm'
              className='h-8 gap-1.5'
              onClick={() => setManualCommentOpen(true)}
            >
              <MessageSquarePlus className='size-3.5' />
              <span className='hidden sm:inline'>Comment</span>
            </Button>
          )}
          <ThemeSwitch />
          <span className='hidden sm:inline-flex'><ProfileDropdown /></span>
        </div>
      </Header>

      <Main>
        <PageDescription
          summary='A unified view of all automated actions across your keywords, followings, and tracked posts. See which items have auto-reply or auto-react enabled.'
          details='Auto actions are configured individually on each keyword, following, or tracked post. This page shows them all in one place so you can quickly see what is automated and adjust settings.'
          className='mb-4'
        />

        {/* Filter pills */}
        <div className='mb-4 flex flex-wrap gap-1'>
          {([['all', 'All'], ['keyword', 'Keywords'], ['following', 'Channels'], ['tracked-post', 'Posts']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filter === key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {label} <span className='ml-0.5 opacity-60'>{counts[key]}</span>
            </button>
          ))}
        </div>

        {loading && (
          <div className='space-y-1'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='flex items-center gap-4 rounded-md px-3 py-3'>
                <Skeleton className='size-5 rounded' />
                <Skeleton className='h-4 w-40' />
                <Skeleton className='ml-auto h-4 w-20' />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center'>
            <div className='mb-4 flex size-14 items-center justify-center rounded-full bg-muted'>
              <Zap className='size-7 text-muted-foreground' />
            </div>
            <h3 className='text-base font-semibold'>No auto actions configured</h3>
            <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
              Auto actions appear here when you enable auto-reply or auto-react on your keywords, followings, or tracked posts.
            </p>
            <ul className='mt-4 space-y-1 text-start text-xs text-muted-foreground'>
              <li className='flex items-start gap-2'>
                <span className='mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/50' />
                <span>Go to Keywords → select a keyword → enable Auto Comment</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/50' />
                <span>Go to Followings → select a channel → enable Auto Reply</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/50' />
                <span>Go to Tracked Posts → select a post → enable Auto React</span>
              </li>
            </ul>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow className='text-xs'>
                  <TableHead className='w-[260px]'>Name</TableHead>
                  <TableHead className='hidden sm:table-cell'>Platforms</TableHead>
                  <TableHead className='w-[70px] text-center'>Active</TableHead>
                  <TableHead className='hidden md:table-cell text-center'>Auto Reply</TableHead>
                  <TableHead className='hidden md:table-cell text-center'>Auto React</TableHead>
                  <TableHead className='hidden lg:table-cell text-right'>Info</TableHead>
                  <TableHead className='w-[40px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => {
                  const meta = TYPE_META[row.type]
                  const Icon = meta.icon
                  return (
                    <TableRow key={`${row.type}-${row.id}`} className='cursor-pointer' onClick={() => navigate({ to: row.settingsUrl })}>
                      {/* Name */}
                      <TableCell className='py-2'>
                        <div className='flex items-center gap-2'>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Icon className={cn('size-4 shrink-0', meta.color)} />
                            </TooltipTrigger>
                            <TooltipContent>{meta.label}</TooltipContent>
                          </Tooltip>
                          <div className='min-w-0'>
                            <span className='block truncate text-sm font-medium'>{row.name}</span>
                            {row.subtitle && <span className='block truncate text-[11px] text-muted-foreground'>{row.subtitle}</span>}
                          </div>
                        </div>
                      </TableCell>

                      {/* Platforms */}
                      <TableCell className='hidden py-2 sm:table-cell'>
                        <div className='flex gap-0.5'>
                          {row.platforms.map((p) => <PlatformIcon key={p} platform={p} size='sm' />)}
                        </div>
                      </TableCell>

                      {/* Active */}
                      <TableCell className='py-2 text-center' onClick={(e) => e.stopPropagation()}>
                        <span className={cn(
                          'inline-block size-2.5 rounded-full',
                          row.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'
                        )} />
                      </TableCell>

                      {/* Auto Reply */}
                      <TableCell className='hidden py-2 md:table-cell'>
                        {row.autoReply ? (
                          <div className='flex flex-wrap items-center justify-center gap-1'>
                            <Badge variant='outline' className='gap-1 rounded-full px-1.5 py-0.5 text-[11px]'>
                              <Blend className='!size-3.5' />≥{row.autoReply.threshold}%
                            </Badge>
                            {(row.autoReply.scoreThreshold ?? 0) > 0 && (
                              <Badge variant='outline' className='gap-1 rounded-full px-1.5 py-0.5 text-[11px]'>
                                <Megaphone className='!size-3.5' />≥{row.autoReply.scoreThreshold}
                              </Badge>
                            )}
                            {((row.autoReply.countMin ?? 0) > 0 || (row.autoReply.countMax ?? 10) < 10) && (
                              <Badge variant='outline' className='gap-1 rounded-full px-1.5 py-0.5 text-[11px]'>
                                <Bot className='!size-3.5' />{row.autoReply.countMin ?? 0}–{row.autoReply.countMax ?? 10}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className='block text-center text-xs text-muted-foreground'>off</span>
                        )}
                      </TableCell>

                      {/* Auto React */}
                      <TableCell className='hidden py-2 md:table-cell'>
                        {row.autoReact ? (
                          <div className='flex flex-wrap items-center justify-center gap-1'>
                            <Badge variant='outline' className='gap-1 rounded-full px-1.5 py-0.5 text-[11px]'>
                              <Blend className='!size-3.5' />≥{row.autoReact.threshold}%
                            </Badge>
                            {(Object.entries(row.autoReact.sentiments) as [SentimentId, string | null][])
                              .filter(([, r]) => r != null)
                              .map(([s, r]) => {
                                const { icon: SIcon, color } = SENT[s]
                                return (
                                  <Badge key={s} variant='outline' className='gap-0.5 rounded-full py-0.5 pl-1 pr-1.5 text-[11px]'>
                                    <SIcon className={`!size-3.5 ${color}`} />
                                    <ArrowRight className='!size-3 text-muted-foreground' />
                                    {r === 'POSITIVE' ? <ThumbsUp className='!size-3.5 text-green-600 dark:text-green-400' /> : <ThumbsDown className='!size-3.5 text-red-600 dark:text-red-400' />}
                                  </Badge>
                                )
                              })}
                          </div>
                        ) : (
                          <span className='block text-center text-xs text-muted-foreground'>off</span>
                        )}
                      </TableCell>

                      {/* Info */}
                      <TableCell className='hidden py-2 text-right text-xs text-muted-foreground lg:table-cell'>
                        {row.extra ?? formatDistanceToNow(new Date(row.updatedAt), { addSuffix: true })}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className='py-2' onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' className='size-7'><MoreHorizontal className='size-4' /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem onClick={() => navigate({ to: row.settingsUrl })}>
                              <Pencil className='size-4' />Settings
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Main>

      <ManualCommentDialog
        open={manualCommentOpen}
        onOpenChange={setManualCommentOpen}
      />
    </>
  )
}
