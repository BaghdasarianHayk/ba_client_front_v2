import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { useSearch } from '@tanstack/react-router'
import {
  ArrowUpDown,
  AtSign,
  CalendarIcon,
  Filter,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { DateSeparator } from '@/components/date-separator'
import { DateRangePresets } from '@/components/shared/date-range-presets'
import { useProjectStore } from '@/stores/project-store'
import {
  MentionService,
  type MentionFilters,
  type MentionStats,
} from '@/services/api/mention-service'
import { useMentionFilters } from '@/hooks/use-mention-filters'
import { PostService } from '@/services/api/post-service'
import { ChannelService } from '@/services/api/channel-service'
import { POSTER_TASK_COMPLETED_EVENT } from '@/services/api/poster-service'
import { mentionToPost } from './transforms'
import type { PostData } from './types'
import { PostCard } from './components/post-card'
import { MentionsFilter } from './components/mentions-filter'
import { FilterBadges } from './components/filter-badges'

const PER_PAGE = 20

// ─── Sort options (from MVP) ──────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest', order_by: 'posted_at' as const, order_direction: 'desc' as const },
  { id: 'oldest', label: 'Oldest', order_by: 'posted_at' as const, order_direction: 'asc' as const },
  { id: 'most-relevant', label: 'Most Relevant', order_by: 'relevance' as const, order_direction: 'desc' as const },
  { id: 'least-relevant', label: 'Least Relevant', order_by: 'relevance' as const, order_direction: 'asc' as const },
  { id: 'highest-score', label: 'Highest Reach Score', order_by: 'unified_score' as const, order_direction: 'desc' as const },
  { id: 'lowest-score', label: 'Lowest Reach Score', order_by: 'unified_score' as const, order_direction: 'asc' as const },
]

function currentSortLabel(f: MentionFilters) {
  return SORT_OPTIONS.find((o) => o.order_by === f.order_by && o.order_direction === f.order_direction)?.label ?? 'Newest'
}

// ─── Default filters: newest, last 7 days ────────────────────────────────────
function getDefaults(): MentionFilters {
  const now = new Date()
  const from = new Date()
  from.setDate(now.getDate() - 7)
  from.setHours(0, 0, 0, 0)
  now.setHours(23, 59, 59, 999)
  return {
    order_by: 'posted_at',
    order_direction: 'desc',
    posted_at_from: from.toISOString(),
    posted_at_to: now.toISOString(),
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────
export function Mentions() {
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const { filters, setFilters, updateFilter } = useMentionFilters()
  const defaultsApplied = useRef(false)

  const [posts, setPosts] = useState<PostData[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [stats, setStats] = useState<MentionStats | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  // Map of post subscription ID → active status
  const [postStatusMap, setPostStatusMap] = useState<Map<string, boolean>>(new Map())
  // Map of channel username → subscription ID (for Follow/Following detection)
  const [followingMap, setFollowingMap] = useState<Map<string, string>>(new Map())

  const loadMoreRef = useRef<HTMLDivElement>(null)

  // ── Deep-link: handle ?mention=<id> search param ───────────────────────────
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>
  const mentionParam = typeof rawSearch.mention === 'string' ? rawSearch.mention : undefined
  const [highlightedMentionId, setHighlightedMentionId] = useState<string | null>(null)
  const lastFetchedMention = useRef<string | null>(null)

  useEffect(() => {
    if (!mentionParam || !projectId) return
    // Don't re-fetch the same mention
    if (lastFetchedMention.current === mentionParam) return
    lastFetchedMention.current = mentionParam

    MentionService.getMention(projectId, mentionParam)
      .then((mention) => {
        const post = mentionToPost(mention, keywordIdMap, postStatusMap, followingMap)
        setPosts((prev) => {
          const filtered = prev.filter((p) => p.id !== post.id)
          return [post, ...filtered]
        })
        setHighlightedMentionId(post.id)

        // Poll for the element to appear in DOM (React may take a few frames)
        let attempts = 0
        const maxAttempts = 20 // 20 × 100ms = 2s max
        const scrollInterval = setInterval(() => {
          attempts++
          const el = document.querySelector(`[data-post-id="${post.id}"]`)
          if (el) {
            clearInterval(scrollInterval)
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          } else if (attempts >= maxAttempts) {
            clearInterval(scrollInterval)
          }
        }, 100)

        setTimeout(() => setHighlightedMentionId(null), 8000)
      })
      .catch(() => {
        // Mention might not exist or API error — non-critical
      })
  }, [mentionParam, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build keyword text → ID map from stats
  const keywordIdMap = useMemo(() => {
    if (!stats) return new Map<string, string>()
    const map = new Map<string, string>()
    for (const kw of [...stats.active_keywords, ...stats.inactive_keywords, ...stats.deleted_keywords]) {
      map.set(kw.keyword, kw.id)
    }
    return map
  }, [stats])

  // Apply defaults on first mount if URL has no filter params
  useEffect(() => {
    if (defaultsApplied.current) return
    defaultsApplied.current = true
    const hasAny = Object.keys(filters).length > 0
    if (!hasAny) {
      // Check localStorage for saved filters
      if (projectId) {
        const saved = localStorage.getItem(`ba_mention_filters_${projectId}`)
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as MentionFilters
            if (parsed && typeof parsed === 'object') {
              setFilters(parsed)
              return
            }
          } catch { /* invalid JSON, fall through to defaults */ }
        }
      }
      setFilters(getDefaults())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Effective filters — merge defaults for display even if URL is empty
  const effectiveFilters = useMemo<MentionFilters>(() => {
    const defaults = getDefaults()
    return {
      ...defaults,
      ...filters,
    }
  }, [filters])

  // Persist filters to localStorage when they change
  useEffect(() => {
    if (!projectId || !defaultsApplied.current) return
    if (Object.keys(filters).length > 0) {
      localStorage.setItem(`ba_mention_filters_${projectId}`, JSON.stringify(filters))
    }
  }, [filters, projectId])

  // ── Fetch mentions ─────────────────────────────────────────────────────────
  const fetchMentions = useCallback(
    async (p: number, append = false) => {
      if (!projectId) return
      if (append) setIsLoadingMore(true)
      else setIsLoading(true)

      try {
        const res = await MentionService.getMentions(projectId, {
          ...effectiveFilters,
          page: p,
          per_page: PER_PAGE,
        })
        const transformed = res.mentions.map((m) => mentionToPost(m, keywordIdMap, postStatusMap, followingMap))
        if (append) {
          setPosts((prev) => [...prev, ...transformed])
        } else {
          // Preserve deep-linked mention at the top if it exists
          setPosts((prev) => {
            if (highlightedMentionId) {
              const deepLinked = prev.find((p) => p.id === highlightedMentionId)
              if (deepLinked) {
                const withoutDupe = transformed.filter((p) => p.id !== highlightedMentionId)
                return [deepLinked, ...withoutDupe]
              }
            }
            return transformed
          })
        }
        setTotal(res.total)
        setTotalPages(res.totalPages)
        setPage(p)
      } catch (err: any) {
        toast.error(err.detail || err.message || 'Failed to load mentions')
        if (!append) { setPosts([]); setTotal(0) }
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [projectId, effectiveFilters, keywordIdMap, postStatusMap, followingMap]
  )

  // ── Fetch stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!projectId) return
    try {
      setStats(
        await MentionService.getStats(
          projectId,
          effectiveFilters.posted_at_from,
          effectiveFilters.posted_at_to
        )
      )
    } catch { /* non-critical */ }
  }, [projectId, effectiveFilters.posted_at_from, effectiveFilters.posted_at_to])

  useEffect(() => {
    // Don't reset if we're handling a deep-link (mention will be prepended separately)
    if (!mentionParam) setPosts([])
    setPage(1)
    fetchMentions(1)
  }, [fetchMentions]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStats() }, [fetchStats])

  // Refetch when a poster task finishes — clears PENDING placeholders and
  // surfaces the newly-posted comment/reply in the tree.
  // Uses a soft refetch: updates data in-place without clearing the list.
  useEffect(() => {
    const handler = async () => {
      if (!projectId) return
      try {
        const res = await MentionService.getMentions(projectId, {
          ...effectiveFilters,
          page: 1,
          per_page: page * PER_PAGE, // Fetch all currently loaded pages
        })
        const transformed = res.mentions.map((m) => mentionToPost(m, keywordIdMap, postStatusMap, followingMap))
        setPosts(transformed)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      } catch {
        // Silent — non-critical background refresh
      }
    }
    window.addEventListener(POSTER_TASK_COMPLETED_EVENT, handler)
    return () => window.removeEventListener(POSTER_TASK_COMPLETED_EVENT, handler)
  }, [projectId, effectiveFilters, page, keywordIdMap, postStatusMap, followingMap])

  // Fetch post subscription statuses
  useEffect(() => {
    if (!projectId) return
    PostService.getPosts(projectId)
      .then(({ posts: tracked }) => {
        const map = new Map<string, boolean>()
        for (const tp of tracked) map.set(tp.id, tp.status === 'active')
        setPostStatusMap(map)
      })
      .catch(() => { /* non-critical */ })
  }, [projectId])

  // Fetch followings for Follow/Following detection
  useEffect(() => {
    if (!projectId) return
    ChannelService.getChannels(projectId)
      .then((channels) => {
        const map = new Map<string, string>()
        for (const ch of channels) map.set(ch.username.toLowerCase(), ch.id)
        setFollowingMap(map)
      })
      .catch(() => { /* non-critical */ })
  }, [projectId])

  // Infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading && !isLoadingMore && page < totalPages)
          fetchMentions(page + 1, true)
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.unobserve(el)
  }, [page, totalPages, isLoading, isLoadingMore, fetchMentions])

  const hasMore = page < totalPages

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; posts: PostData[] }[] = []
    let cur = ''
    for (const post of posts) {
      const d = format(post.createdAt, 'd MMM, yyyy')
      if (d !== cur) { cur = d; groups.push({ date: d, posts: [post] }) }
      else groups[groups.length - 1].posts.push(post)
    }
    return groups
  }, [posts])

  // Count extra filters (beyond sort + date which are always shown)
  const extraFilterCount = useMemo(() => {
    let c = 0
    if (filters.search) c++
    if (filters.platform) c++
    if (filters.sentiment) c++
    if (filters.replied) c++
    if (filters.keywords) c++
    if (filters.has_comments !== undefined) c++
    if (filters.is_commentable !== undefined) c++
    if (filters.relevance_from !== undefined || filters.relevance_to !== undefined) c++
    if (filters.unified_score_from !== undefined || filters.unified_score_to !== undefined) c++
    return c
  }, [filters])

  // Date display
  const dateFrom = effectiveFilters.posted_at_from ? new Date(effectiveFilters.posted_at_from) : undefined
  const dateTo = effectiveFilters.posted_at_to ? new Date(effectiveFilters.posted_at_to) : undefined

  return (
    <>
      <Header fixed>
        {/* Count + updated */}
        <div className='flex shrink-0 flex-col justify-center leading-none'>
          <h1 className='text-sm font-semibold whitespace-nowrap'>
            {isLoading ? (
              <Skeleton className='inline-block h-4 w-24' />
            ) : (
              `${total} Mentions`
            )}
          </h1>
          <span className='hidden text-[11px] text-muted-foreground whitespace-nowrap sm:inline'>
            {currentProject?.last_search
              ? `Updated ${format(new Date(currentProject.last_search), 'd MMM, HH:mm')}`
              : 'No data yet'}
          </span>
        </div>

        {/* Sort badge — always visible */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted'>
              <ArrowUpDown className='size-3' />
              <span className='hidden xs:inline'>{currentSortLabel(effectiveFilters)}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start'>
            {SORT_OPTIONS.map((o) => (
              <DropdownMenuItem
                key={o.id}
                onClick={() => updateFilter({ order_by: o.order_by, order_direction: o.order_direction })}
                className={effectiveFilters.order_by === o.order_by && effectiveFilters.order_direction === o.order_direction ? 'bg-accent' : ''}
              >
                {o.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date range badge — always visible, clickable to edit */}
        {dateFrom && (
          <Popover>
            <PopoverTrigger asChild>
              <button className='hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted sm:inline-flex'>
                <CalendarIcon className='size-3' />
                {format(dateFrom, 'MMM d')}
                {dateTo && ` – ${format(dateTo, 'MMM d')}`}
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <DateRangePresets
                from={dateFrom}
                onSelect={(from, to) => {
                  const f = new Date(from); f.setHours(0, 0, 0, 0)
                  const t = new Date(to); t.setHours(23, 59, 59, 999)
                  updateFilter({
                    posted_at_from: f.toISOString(),
                    posted_at_to: t.toISOString(),
                  })
                }}
              />
              <Calendar
                mode='single'
                modifiers={{
                  range_start: dateFrom ? [dateFrom] : [],
                  range_end: dateTo ? [dateTo] : [],
                  range_middle: dateFrom && dateTo
                    ? { after: dateFrom, before: dateTo }
                    : [],
                }}
                modifiersClassNames={{
                  range_start: 'bg-primary text-primary-foreground rounded-l-md',
                  range_end: 'bg-primary text-primary-foreground rounded-r-md',
                  range_middle: 'bg-accent text-accent-foreground rounded-none',
                }}
                onDayClick={(day) => {
                  if (!dateFrom || (dateFrom && dateTo)) {
                    // Start new range
                    const f = new Date(day); f.setHours(0, 0, 0, 0)
                    updateFilter({ posted_at_from: f.toISOString(), posted_at_to: undefined })
                  } else {
                    // Set end
                    let from = dateFrom, to = day
                    if (day < dateFrom) { from = day; to = dateFrom }
                    const f = new Date(from); f.setHours(0, 0, 0, 0)
                    const t = new Date(to); t.setHours(23, 59, 59, 999)
                    updateFilter({ posted_at_from: f.toISOString(), posted_at_to: t.toISOString() })
                  }
                }}
                disabled={(d) => d > new Date()}
                numberOfMonths={2}
                defaultMonth={dateFrom}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Extra filter badges */}
        {extraFilterCount > 0 && (
          <div className='no-scrollbar hidden min-w-0 flex-1 overflow-x-auto sm:block'>
            <FilterBadges filters={filters} stats={stats} onUpdate={updateFilter} />
          </div>
        )}

        {/* Right cluster */}
        <div className='ms-auto flex items-center gap-1.5 sm:gap-2'>
          {/* Filter toggle — hidden on wide screens where filter is always visible */}
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant='outline' size='sm' className='h-8 gap-1.5 2xl:hidden'>
                <Filter className='size-3.5' />
                <span className='hidden sm:inline'>Filter</span>
                {extraFilterCount > 0 && (
                  <span className='flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
                    {extraFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='flex w-80 flex-col p-0 sm:w-96 [&>button]:hidden'>
              <MentionsFilter
                filters={effectiveFilters}
                stats={stats}
                onApply={(f) => setFilters(f)}
                onClose={() => setFilterOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <ThemeSwitch />
          <span className='hidden sm:inline-flex'><ProfileDropdown /></span>
        </div>
      </Header>

      <Main>
        <div className='flex gap-6'>
          {/* Content column */}
          <div className='min-w-0 flex-1'>
        {!projectId && !isLoading && (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='mb-4 flex size-14 items-center justify-center rounded-full bg-muted'>
              <AtSign className='size-7 text-muted-foreground' />
            </div>
            <h3 className='text-base font-semibold'>Select a project</h3>
            <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
              Choose a project from the sidebar to view its social media mentions and comments.
            </p>
          </div>
        )}

        {isLoading && (
          <div className='space-y-6'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='space-y-2 rounded-lg px-2 py-3'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='size-5 rounded-full' />
                  <Skeleton className='h-4 w-48' />
                </div>
                <Skeleton className='h-5 w-3/4' />
                <Skeleton className='h-16 w-full' />
                <div className='flex gap-2'>
                  <Skeleton className='h-6 w-16 rounded-full' />
                  <Skeleton className='h-6 w-16 rounded-full' />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && posts.length > 0 && (
          <div>
            {grouped.map((g) => (
              <Fragment key={g.date}>
                <DateSeparator date={g.date} />
                {g.posts.map((post, i) => (
                  <Fragment key={post.id}>
                    <div
                      data-post-id={post.id}
                      className={cn(
                      'rounded-lg px-2 py-3 transition-all duration-700',
                      highlightedMentionId === post.id && 'bg-primary/5 shadow-[inset_3px_0_0_0] shadow-primary rounded-l-none',
                    )}>
                      <PostCard post={post} projectId={projectId} keywordId={post.keywordId ?? undefined} />
                    </div>
                    {i < g.posts.length - 1 && <Separator />}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </div>
        )}

        {!isLoading && projectId && posts.length === 0 && (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='mb-4 flex size-14 items-center justify-center rounded-full bg-muted'>
              <AtSign className='size-7 text-muted-foreground' />
            </div>
            <h3 className='text-base font-semibold'>No mentions found</h3>
            <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
              No posts match your current filters. Try adjusting the date range, removing filters, or adding new keywords.
            </p>
            <ul className='mt-4 space-y-1 text-start text-xs text-muted-foreground'>
              <li className='flex items-start gap-2'>
                <span className='mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/50' />
                <span>Expand the date range to include older posts</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/50' />
                <span>Remove sentiment or platform filters</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/50' />
                <span>Add more keywords in the Keywords section</span>
              </li>
            </ul>
          </div>
        )}

        {hasMore && !isLoading && <div ref={loadMoreRef} className='h-1' />}
        {isLoadingMore && (
          <div className='flex items-center justify-center py-6'>
            <Loader2 className='size-5 animate-spin text-muted-foreground' />
            <span className='ml-2 text-sm text-muted-foreground'>Loading more…</span>
          </div>
        )}
        {!isLoading && !hasMore && posts.length > 0 && (
          <p className='py-6 text-center text-sm text-muted-foreground'>No more mentions to load</p>
        )}
          </div>

          {/* Filter sidebar — visible only on wide screens */}
          <aside className='hidden w-80 shrink-0 2xl:block'>
            <div className='sticky top-20 flex h-[calc(100svh-6rem)] flex-col rounded-lg border'>
              <MentionsFilter
                filters={effectiveFilters}
                stats={stats}
                onApply={(f) => setFilters(f)}
                onClose={() => {}}
              />
            </div>
          </aside>
        </div>
      </Main>
    </>
  )
}
