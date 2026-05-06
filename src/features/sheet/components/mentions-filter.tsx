import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  BotMessageSquare,
  CalendarIcon,
  MessageCircleOff,
  MessageCircleReply,
  MessageSquare,
  MessageSquareOff,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { PlatformSelector } from '@/components/shared/platform-selector'
import { SentimentSelector } from '@/components/shared/sentiment-selector'
import { DateRangePresets } from '@/components/shared/date-range-presets'
import type { PlatformId } from '@/components/platform-icon'
import type { MentionFilters, MentionStats } from '@/services/api/mention-service'

// ─── Sort options ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest', order_by: 'posted_at' as const, order_direction: 'desc' as const },
  { id: 'oldest', label: 'Oldest', order_by: 'posted_at' as const, order_direction: 'asc' as const },
  { id: 'most-relevant', label: 'Most Relevant', order_by: 'relevance' as const, order_direction: 'desc' as const },
  { id: 'least-relevant', label: 'Least Relevant', order_by: 'relevance' as const, order_direction: 'asc' as const },
  { id: 'highest-score', label: 'Highest Reach Score', order_by: 'unified_score' as const, order_direction: 'desc' as const },
  { id: 'lowest-score', label: 'Lowest Reach Score', order_by: 'unified_score' as const, order_direction: 'asc' as const },
]

function sortIdFrom(f: MentionFilters) {
  return SORT_OPTIONS.find((o) => o.order_by === f.order_by && o.order_direction === f.order_direction)?.id ?? 'newest'
}

// ─── Types ───────────────────────────────────────────────────────────────────
type SentimentId = 'positive' | 'neutral' | 'negative' | 'question'

interface Props {
  filters: MentionFilters
  stats: MentionStats | null
  onApply: (filters: MentionFilters) => void
  onClose?: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────
export function MentionsFilter({ filters, stats, onApply, onClose }: Props) {
  // ── Local state (mirrors filters, applied on "Apply") ────────────────────
  const [search, setSearch] = useState(filters.search ?? '')
  const [sortId, setSortId] = useState(sortIdFrom(filters))

  // Date range — simple two-click: first click = from, second = to
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.posted_at_from ? new Date(filters.posted_at_from) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.posted_at_to ? new Date(filters.posted_at_to) : undefined
  )

  const handleDayClick = (day: Date) => {
    if (!dateFrom || (dateFrom && dateTo)) {
      // No range yet, or range complete → start new range
      setDateFrom(day)
      setDateTo(undefined)
    } else {
      // Have from, no to → set end date
      if (day < dateFrom) {
        setDateTo(dateFrom)
        setDateFrom(day)
      } else {
        setDateTo(day)
      }
    }
  }

  const handlePreset = (from: Date, to: Date) => {
    setDateFrom(from)
    setDateTo(to)
  }

  // Platforms
  const [platforms, setPlatforms] = useState<PlatformId[]>(
    filters.platform
      ? (filters.platform.split(',').map((p) => (p === 'twitter' ? 'x' : p)) as PlatformId[])
      : []
  )

  // Sentiments
  const [sentiments, setSentiments] = useState<Set<SentimentId>>(
    filters.sentiment
      ? new Set(filters.sentiment.toLowerCase().split(',') as SentimentId[])
      : new Set()
  )

  // Keywords
  const allKeywords = [
    ...(stats?.active_keywords ?? []).map((k) => ({ ...k, group: 'active' as const })),
    ...(stats?.inactive_keywords ?? []).map((k) => ({ ...k, group: 'inactive' as const })),
    ...(stats?.deleted_keywords ?? []).map((k) => ({ ...k, group: 'deleted' as const })),
  ]
  const [selectedKw, setSelectedKw] = useState<Set<string>>(() => {
    if (filters.keywords) return new Set(filters.keywords.split(','))
    return new Set(allKeywords.map((k) => k.id))
  })

  // Replied
  const initReplied = filters.replied?.split(',') ?? []
  const [notReplied, setNotReplied] = useState(initReplied.length === 0 || initReplied.includes('not'))
  const [autoReplied, setAutoReplied] = useState(initReplied.length === 0 || initReplied.includes('auto'))
  const [manualReplied, setManualReplied] = useState(initReplied.length === 0 || initReplied.includes('manual'))

  // Comments
  const [hasComments, setHasComments] = useState<boolean | undefined>(filters.has_comments)
  const [isCommentable, setIsCommentable] = useState<boolean | undefined>(filters.is_commentable)

  // Relevance
  const [relRange, setRelRange] = useState<[number, number]>([
    filters.relevance_from ?? 0,
    filters.relevance_to ?? 100,
  ])

  // Score
  const minScore = stats?.min_unified_score ?? 0
  const maxScore = stats?.max_unified_score ?? 1000
  const [scoreRange, setScoreRange] = useState<[number, number]>([
    filters.unified_score_from ?? minScore,
    filters.unified_score_to ?? maxScore,
  ])

  // Sync score range when stats load
  useEffect(() => {
    if (stats && filters.unified_score_from === undefined && filters.unified_score_to === undefined) {
      setScoreRange([stats.min_unified_score, stats.max_unified_score])
    }
  }, [stats, filters.unified_score_from, filters.unified_score_to])

  // ── Build & apply ────────────────────────────────────────────────────────
  const handleApply = () => {
    const f: MentionFilters = { page: 1 }

    if (search) f.search = search

    const sort = SORT_OPTIONS.find((o) => o.id === sortId)
    if (sort) { f.order_by = sort.order_by; f.order_direction = sort.order_direction }

    if (dateFrom) {
      const d = new Date(dateFrom); d.setHours(0, 0, 0, 0)
      f.posted_at_from = d.toISOString()
    }
    if (dateTo) {
      const d = new Date(dateTo); d.setHours(23, 59, 59, 999)
      f.posted_at_to = d.toISOString()
    }

    if (platforms.length) f.platform = platforms.map((p) => (p === 'x' ? 'twitter' : p)).join(',')
    if (sentiments.size) f.sentiment = Array.from(sentiments).map((s) => s.toUpperCase()).join(',')

    if (selectedKw.size > 0 && selectedKw.size < allKeywords.length) {
      f.keywords = Array.from(selectedKw).join(',')
    }

    const replied: string[] = []
    if (notReplied) replied.push('not')
    if (autoReplied) replied.push('auto')
    if (manualReplied) replied.push('manual')
    if (replied.length > 0 && replied.length < 3) f.replied = replied.join(',')

    if (hasComments !== undefined) f.has_comments = hasComments
    if (isCommentable !== undefined) f.is_commentable = isCommentable

    if (relRange[0] > 0 || relRange[1] < 100) {
      f.relevance_from = relRange[0]; f.relevance_to = relRange[1]
    }
    if (scoreRange[0] > minScore || scoreRange[1] < maxScore) {
      f.unified_score_from = scoreRange[0]; f.unified_score_to = scoreRange[1]
    }

    onApply(f)
    onClose?.()
  }

  const handleClear = () => {
    setSearch('')
    setSortId('newest')
    setDateFrom(undefined)
    setDateTo(undefined)
    setPlatforms([])
    setSentiments(new Set())
    setSelectedKw(new Set(allKeywords.map((k) => k.id)))
    setNotReplied(true); setAutoReplied(true); setManualReplied(true)
    setHasComments(undefined)
    setIsCommentable(undefined)
    setRelRange([0, 100])
    setScoreRange([minScore, maxScore])
  }

  const waitingForEnd = dateFrom && !dateTo

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <div className='flex shrink-0 items-center justify-between px-4 py-3'>
        <span className='text-sm font-semibold'>Filters</span>
        <Button variant='ghost' size='sm' className='h-7 text-xs' onClick={handleClear}>
          <X className='mr-1 size-3' />Clear
        </Button>
      </div>
      <Separator className='shrink-0' />

      <div className='min-h-0 flex-1 overflow-y-auto px-4'>
        <div className='space-y-4 py-3'>
          {/* Search */}
          <Section label='Search'>
            <div className='relative'>
              <Search className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input className='pl-8' placeholder='Search posts…' value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </Section>

          {/* Sort */}
          <Section label='Sort'>
            <Select value={sortId} onValueChange={setSortId}>
              <SelectTrigger className='h-9'><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Section>

          {/* Date range */}
          <Section label='Date range'>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='h-9 w-full justify-start font-normal'>
                  <CalendarIcon className='mr-2 size-4' />
                  {dateFrom
                    ? dateTo
                      ? `${format(dateFrom, 'MMM d')} – ${format(dateTo, 'MMM d')}`
                      : `${format(dateFrom, 'MMM d')} – pick end`
                    : 'Pick a date range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <DateRangePresets from={dateFrom} onSelect={handlePreset} />
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
                  onDayClick={handleDayClick}
                  disabled={(d) => d > new Date()}
                  numberOfMonths={2}
                  defaultMonth={dateFrom}
                />
                <div className='border-t px-3 py-2 text-xs text-muted-foreground'>
                  {waitingForEnd
                    ? '← Now pick the end date'
                    : dateFrom && dateTo
                      ? 'Click a day to start a new range'
                      : 'Pick a start date'}
                </div>
              </PopoverContent>
            </Popover>
          </Section>

          {/* Keywords */}
          {allKeywords.length > 0 && (
            <Section label='Keywords'>
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-muted-foreground'>
                  {selectedKw.size}/{allKeywords.length} selected
                </span>
                <Button
                  variant='ghost' size='sm' className='h-6 text-[11px]'
                  onClick={() => setSelectedKw(
                    selectedKw.size === allKeywords.length
                      ? new Set()
                      : new Set(allKeywords.map((k) => k.id))
                  )}
                >
                  {selectedKw.size === allKeywords.length ? 'Deselect all' : 'Select all'}
                </Button>
              </div>
              <div className='max-h-40 space-y-1 overflow-y-auto'>
                {allKeywords.map((kw) => (
                  <label key={kw.id} className='flex cursor-pointer items-center gap-2 text-sm'>
                    <Checkbox
                      checked={selectedKw.has(kw.id)}
                      onCheckedChange={() => {
                        const next = new Set(selectedKw)
                        next.has(kw.id) ? next.delete(kw.id) : next.add(kw.id)
                        setSelectedKw(next)
                      }}
                    />
                    <span className={kw.group !== 'active' ? 'text-muted-foreground' : ''}>
                      {kw.keyword}
                    </span>
                    <span className='ml-auto text-[11px] text-muted-foreground'>
                      {kw.count}
                    </span>
                  </label>
                ))}
              </div>
            </Section>
          )}

          {/* Platforms */}
          <Section label='Platforms'>
            <PlatformSelector value={platforms} onChange={setPlatforms} />
          </Section>

          {/* Sentiments */}
          <Section label='Sentiment'>
            <SentimentSelector value={sentiments} onChange={setSentiments} />
          </Section>

          {/* Replied */}
          <Section label='Replied'>
            <div className='space-y-1'>
              <Check2 icon={MessageCircleOff} label='Not Replied' checked={notReplied} onChange={setNotReplied} />
              <Check2 icon={BotMessageSquare} label='Auto Replied' checked={autoReplied} onChange={setAutoReplied} />
              <Check2 icon={MessageCircleReply} label='Manual Replied' checked={manualReplied} onChange={setManualReplied} />
            </div>
          </Section>

          {/* Comments */}
          <Section label='Comments'>
            <div className='flex gap-1'>
              <Pill on={hasComments === undefined} onClick={() => setHasComments(undefined)}>All</Pill>
              <Pill on={hasComments === true} onClick={() => setHasComments(true)} icon={MessageSquare}>With</Pill>
              <Pill on={hasComments === false} onClick={() => setHasComments(false)} icon={MessageSquareOff}>Without</Pill>
            </div>
          </Section>

          {/* Commentable */}
          <Section label='Commentable'>
            <div className='flex gap-1'>
              <Pill on={isCommentable === undefined} onClick={() => setIsCommentable(undefined)}>All</Pill>
              <Pill on={isCommentable === true} onClick={() => setIsCommentable(true)}>Yes</Pill>
              <Pill on={isCommentable === false} onClick={() => setIsCommentable(false)}>No</Pill>
            </div>
          </Section>

          {/* Relevance */}
          <Section label='Relevance'>
            <div className='flex items-center gap-2'>
              <span className='w-8 text-right text-xs text-muted-foreground'>{relRange[0]}</span>
              <Slider value={relRange} onValueChange={(v) => setRelRange(v as [number, number])} min={0} max={100} step={1} className='flex-1' />
              <span className='w-8 text-xs text-muted-foreground'>{relRange[1]}</span>
            </div>
          </Section>

          {/* Score */}
          <Section label='Reach Score'>
            <div className='flex items-center gap-2'>
              <span className='w-10 text-right text-xs text-muted-foreground'>{scoreRange[0]}</span>
              <Slider value={scoreRange} onValueChange={(v) => setScoreRange(v as [number, number])} min={minScore} max={maxScore} step={10} className='flex-1' />
              <span className='w-10 text-xs text-muted-foreground'>{scoreRange[1]}</span>
            </div>
          </Section>
        </div>
      </div>

      <Separator className='shrink-0' />
      <div className='p-3'>
        <Button className='w-full' onClick={handleApply}>Apply Filters</Button>
      </div>
    </div>
  )
}

// ─── Tiny helpers ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1.5'>
      <Label className='text-xs font-medium text-muted-foreground'>{label}</Label>
      {children}
    </div>
  )
}

function Check2({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ElementType
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className='flex cursor-pointer items-center gap-2 text-sm'>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <Icon className='size-4 text-muted-foreground' />
      {label}
    </label>
  )
}

function Pill({
  on,
  onClick,
  icon: Icon,
  children,
}: {
  on: boolean
  onClick: () => void
  icon?: React.ElementType
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
    >
      {Icon && <Icon className='size-3.5' />}
      {children}
    </button>
  )
}
