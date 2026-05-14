import { useCallback, useEffect, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { useNavigate } from '@tanstack/react-router'
import {
  BotMessageSquare,
  CalendarIcon,
  CircleAlert,
  ExternalLink,
  Loader2,
  MessageCircleMore,
  MessageSquare,
  RefreshCw,
  SmilePlus,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import { EmptyState } from '@/components/empty-state'
import { PageDescription } from '@/components/page-description'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { PlatformIcon, type PlatformId } from '@/components/platform-icon'
import { DateRangePresets } from '@/components/shared/date-range-presets'
import { useProjectStore } from '@/stores/project-store'
import { useTaskStore } from '@/stores/task-store'
import {
  PosterService,
  POSTER_TASK_COMPLETED_EVENT,
  type BackgroundTask,
} from '@/services/api/poster-service'

// ─── Config ──────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'processing' | 'done' | 'error'
const PAGE_SIZE = 30

function taskType(t: BackgroundTask) {
  if (t.content.startsWith('Reaction:')) return 'reaction' as const
  if (t.content.startsWith('Delete') || t.content.startsWith('Deleting')) return 'delete' as const
  if (t.mention_id) return 'comment' as const
  return 'reply' as const
}

const TYPE_META = {
  reaction: { icon: SmilePlus, label: 'Reaction', color: 'text-amber-500' },
  reply: { icon: MessageCircleMore, label: 'Reply', color: 'text-blue-500' },
  comment: { icon: MessageSquare, label: 'Comment', color: 'text-emerald-500' },
  delete: { icon: Trash2, label: 'Delete', color: 'text-red-400' },
} as const

// ─── Tiny components ─────────────────────────────────────────────────────────

function TypeCell({ task }: { task: BackgroundTask }) {
  const t = taskType(task)
  const m = TYPE_META[t]
  const Icon = m.icon
  return (
    <div className='flex items-center gap-2'>
      <div className={cn('flex size-7 items-center justify-center rounded-md bg-muted', task.status === 'processing' && 'bg-orange-500/10', task.status === 'error' && 'bg-red-500/10')}>
        {task.status === 'processing' ? (
          <Loader2 className='size-3.5 animate-spin text-orange-500' />
        ) : task.status === 'error' ? (
          <CircleAlert className='size-3.5 text-red-500' />
        ) : (
          <Icon className={cn('size-3.5', m.color)} />
        )}
      </div>
      <span className='text-xs font-medium'>{m.label}</span>
    </div>
  )
}

function StatusCell({ status }: { status: string }) {
  return (
    <div className='flex items-center gap-1.5'>
      <span className={cn(
        'inline-block size-2 rounded-full',
        status === 'done' && 'bg-green-500',
        status === 'processing' && 'bg-orange-400 animate-pulse',
        status === 'error' && 'bg-red-500',
        status === 'fallback' && 'bg-yellow-500 animate-pulse',
      )} />
      <span className={cn(
        'text-xs',
        status === 'done' && 'text-green-600 dark:text-green-400',
        status === 'processing' && 'text-orange-600 dark:text-orange-400',
        status === 'error' && 'text-red-600 dark:text-red-400',
        status === 'fallback' && 'text-yellow-600 dark:text-yellow-400',
      )}>
        {status === 'done' ? 'Done' : status === 'processing' ? 'Running' : status === 'error' ? 'Failed' : status === 'fallback' ? 'Retrying' : status}
      </span>
    </div>
  )
}

function ContentCell({ task }: { task: BackgroundTask }) {
  const t = taskType(task)
  const content = t === 'reaction' ? task.content.replace(/^Reaction:\s*/, '') : task.content
  return (
    <div className='min-w-0'>
      <p className='max-w-sm truncate text-sm'>{content}</p>
      {task.mention_content && (
        <p className='mt-0.5 max-w-sm truncate text-xs text-muted-foreground'>
          {task.mention_author && <span className='font-medium'>{task.mention_author}: </span>}
          {task.mention_content}
        </p>
      )}
      {task.error && (
        <p className='mt-0.5 max-w-sm truncate text-xs text-red-600 dark:text-red-400'>{task.error}</p>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function Tasks() {
  const { currentProject } = useProjectStore()
  const customerId = currentProject?.customer_id
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<BackgroundTask[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const offsetRef = useRef(0)

  // Date picker two-click logic (same as mentions filter)
  const handleDayClick = (day: Date) => {
    if (!dateFrom || (dateFrom && dateTo)) {
      setDateFrom(day)
      setDateTo(undefined)
    } else {
      if (day < dateFrom) { setDateTo(dateFrom); setDateFrom(day) }
      else setDateTo(day)
    }
  }

  const handlePreset = (from: Date, to: Date) => { setDateFrom(from); setDateTo(to) }
  const clearDate = () => { setDateFrom(undefined); setDateTo(undefined) }

  const fetchTasks = useCallback(
    async (append = false) => {
      if (!customerId) return
      if (append) setLoadingMore(true)
      else { setLoading(true); offsetRef.current = 0 }
      try {
        const filters: Record<string, string> = {}
        if (status !== 'all') filters.status = status
        if (dateFrom) { const d = new Date(dateFrom); d.setHours(0, 0, 0, 0); filters.created_from = d.toISOString() }
        if (dateTo) { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); filters.created_to = d.toISOString() }
        const offset = append ? offsetRef.current : 0
        const res = await PosterService.getBackgroundTasks(customerId, PAGE_SIZE, offset, filters)
        if (append) setTasks((p) => [...p, ...res.tasks])
        else setTasks(res.tasks)
        setTotal(res.total_tasks)
        offsetRef.current = offset + res.tasks.length
      } catch { /* interceptor */ }
      finally { setLoading(false); setLoadingMore(false) }
    },
    [customerId, status, dateFrom, dateTo]
  )

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => {
    const h = () => fetchTasks()
    window.addEventListener(POSTER_TASK_COMPLETED_EVENT, h)
    return () => window.removeEventListener(POSTER_TASK_COMPLETED_EVENT, h)
  }, [fetchTasks])

  const hasMore = tasks.length < total
  const processingCount = useTaskStore((s) => s.processingCount)

  return (
    <>
      <Header fixed>
        <BotMessageSquare className='size-4 text-muted-foreground' />
        <h1 className='text-sm font-semibold'>
          Task History
          {!loading && <span className='ml-1 font-normal text-muted-foreground'>{total}</span>}
        </h1>

        {processingCount > 0 && (
          <span className='flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-600 dark:text-orange-400'>
            <Loader2 className='size-3 animate-spin' />
            {processingCount} running
          </span>
        )}

        <div className='ms-auto flex items-center gap-2'>
          <Button variant='ghost' size='icon' className='size-8' onClick={() => fetchTasks()} disabled={loading}>
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          </Button>
          <ThemeSwitch />
          <span className='hidden sm:inline-flex'><ProfileDropdown /></span>
        </div>
      </Header>

      <Main>
        <PageDescription
          id='tasks-page'
          summary='Task History shows all automated and manual actions: comments, replies, and reactions posted by the system. Track their status and see results.'
          helpAnchor='tasks'
          className='mb-4'
        />

        {/* Filters — always visible */}
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          {/* Status pills */}
          {(['all', 'processing', 'done', 'error'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                status === s
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {s === 'all' ? 'All' : s === 'processing' ? 'Running' : s === 'done' ? 'Done' : 'Failed'}
            </button>
          ))}

          {/* Date range */}
          <Popover>
            <PopoverTrigger asChild>
              <button className='inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted'>
                <CalendarIcon className='size-3' />
                {dateFrom
                  ? dateTo
                    ? `${format(dateFrom, 'MMM d')} – ${format(dateTo, 'MMM d')}`
                    : `${format(dateFrom, 'MMM d')} – …`
                  : 'Any date'}
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <DateRangePresets from={dateFrom} onSelect={handlePreset} />
              <Calendar
                mode='single'
                modifiers={{
                  range_start: dateFrom ? [dateFrom] : [],
                  range_end: dateTo ? [dateTo] : [],
                  range_middle: dateFrom && dateTo ? { after: dateFrom, before: dateTo } : [],
                }}
                modifiersClassNames={{
                  range_start: 'bg-primary text-primary-foreground rounded-l-md',
                  range_end: 'bg-primary text-primary-foreground rounded-r-md',
                  range_middle: 'bg-accent text-accent-foreground rounded-none',
                }}
                onDayClick={handleDayClick}
                disabled={(d) => d > new Date()}
                numberOfMonths={2}
                defaultMonth={dateFrom}
              />
              {dateFrom && (
                <div className='flex items-center justify-between border-t px-3 py-2'>
                  <span className='text-xs text-muted-foreground'>
                    {dateTo ? 'Click to start new range' : 'Pick end date'}
                  </span>
                  <Button variant='ghost' size='sm' className='h-6 text-xs' onClick={clearDate}>Clear</Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Loading */}
        {loading && (
          <div className='space-y-1'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className='flex items-center gap-4 rounded-md px-3 py-2.5'>
                <Skeleton className='size-7 rounded-md' />
                <div className='flex-1 space-y-1.5'>
                  <Skeleton className='h-3.5 w-48' />
                  <Skeleton className='h-3 w-32' />
                </div>
                <Skeleton className='h-3 w-16' />
                <Skeleton className='h-3 w-20' />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && tasks.length === 0 && (
          <EmptyState
            icon={BotMessageSquare}
            title='No tasks found'
            description={
              status !== 'all' || dateFrom
                ? 'No tasks match your current filters. Try changing the status or date range.'
                : 'Tasks appear here when you post comments, replies, or reactions — either manually or via auto actions.'
            }
          />
        )}

        {/* Table */}
        {!loading && tasks.length > 0 && (
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='w-[140px]'>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className='w-[100px]'>Platform</TableHead>
                  <TableHead className='w-[90px]'>Status</TableHead>
                  <TableHead className='w-[110px] text-right'>Time</TableHead>
                  <TableHead className='w-[40px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className={cn(
                      'transition-colors',
                      task.status === 'processing' && 'bg-orange-500/[0.03]',
                      task.status === 'error' && 'bg-red-500/[0.03]',
                      task.mention_id && 'cursor-pointer',
                    )}
                    onClick={() => {
                      if (task.mention_id) {
                        navigate({ to: '/sheet', search: { mention: task.mention_id } })
                      }
                    }}
                  >
                    <TableCell className='py-2.5'>
                      <TypeCell task={task} />
                    </TableCell>
                    <TableCell className='py-2.5'>
                      <ContentCell task={task} />
                    </TableCell>
                    <TableCell className='py-2.5'>
                      <div className='flex items-center gap-1.5'>
                        <PlatformIcon platform={task.platform as PlatformId} size='sm' />
                        <span className='text-xs capitalize text-muted-foreground'>{task.platform}</span>
                      </div>
                    </TableCell>
                    <TableCell className='py-2.5'>
                      <StatusCell status={task.status} />
                    </TableCell>
                    <TableCell className='py-2.5 text-right'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className='text-xs text-muted-foreground'>
                            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{new Date(task.created_at).toLocaleString()}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className='py-2.5'>
                      {task.mention_link && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={task.mention_link.startsWith('http') ? task.mention_link : `https://${task.mention_link}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-muted-foreground transition-colors hover:text-foreground'
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className='size-3.5' />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>View original post</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className='flex justify-center py-6'>
            <Button variant='outline' size='sm' onClick={() => fetchTasks(true)} disabled={loadingMore} className='gap-1.5'>
              {loadingMore ? <><Loader2 className='size-3.5 animate-spin' />Loading…</> : 'Load more'}
            </Button>
          </div>
        )}
        {!loading && !hasMore && tasks.length > 0 && (
          <p className='py-6 text-center text-xs text-muted-foreground'>That's everything</p>
        )}
      </Main>
    </>
  )
}
