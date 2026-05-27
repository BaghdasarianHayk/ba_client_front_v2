import { useState, useMemo } from 'react'
import { format, subDays, differenceInDays } from 'date-fns'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarIcon,
  Download,
  Filter,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { DateRangePresets } from '@/components/shared/date-range-presets'
import { RangeSliderWithInput } from '@/components/shared/range-slider-with-input'
import { aggregateData, type GroupBy } from './data-aggregation'
import {
  mentionsByDay,
  mentionsByHour,
  mentionsByPlatformOverTime,
  mentionsByPlatformByHour,
  reachScoreByPlatform,
  reachScoreByPlatformByHour,
  activityByDay,
  activityByHour,
  topAuthors,
  summary,
  engagementFunnel,
  keywordPerformance,
  peakHoursData,
} from './mock-data'

// ─── Types ───────────────────────────────────────────────────────────────────

// Removed - now imported from data-aggregation.ts

// ─── Colors ──────────────────────────────────────────────────────────────────

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22c55e', neutral: '#f59e0b', negative: '#ef4444', question: '#a855f7',
}

// Highly contrasting chart colors (Yandex.Metrica-inspired, maximally distinct)
const CHART_PLATFORM_COLORS: Record<string, string> = {
  telegram: '#FF9800', // orange
  reddit: '#E91E63',   // pink
  youtube: '#9C27B0',  // purple
  x: '#2196F3',        // blue
  instagram: '#00BCD4', // cyan
  facebook: '#4CAF50', // green
  tiktok: '#F44336',   // red
  web: '#795548',      // brown
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Determines the recommended grouping based on date range
 */
function getRecommendedGrouping(from: Date, to: Date): GroupBy {
  const days = differenceInDays(to, from)
  if (days <= 3) return 'hour' // Up to 3 days = hourly
  if (days <= 60) return 'day'
  if (days <= 365) return 'week'
  return 'month'
}

/**
 * Gets available grouping options based on date range
 */
function getAvailableGroupings(from: Date, to: Date): GroupBy[] {
  const days = differenceInDays(to, from)
  if (days <= 3) return ['hour', 'day'] // Up to 3 days = hour and day
  if (days <= 7) return ['day']
  if (days <= 60) return ['day', 'week']
  if (days <= 365) return ['day', 'week', 'month']
  return ['week', 'month']
}

// ─── Tooltip Styles ──────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  color: '#000000',
}

const TOOLTIP_WRAPPER_STYLE = {
  zIndex: 9999,
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(() => subDays(new Date(), 30))
  const [dateTo, setDateTo] = useState(() => new Date())
  const [activeSentiments, setActiveSentiments] = useState<Set<string>>(new Set())
  const [activePlatforms, setActivePlatforms] = useState<Set<string>>(new Set())
  const [activeReachPlatforms, setActiveReachPlatforms] = useState<Set<string>>(new Set())

  // ── Filter state ────────────────────────────────────────────────────────────
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [relevanceRange, setRelevanceRange] = useState<[number, number]>([0, 100])
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 50000])
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())
  const [selectedSentiments, setSelectedSentiments] = useState<Set<string>>(new Set())
  const [selectedKwTypes, setSelectedKwTypes] = useState<Set<string>>(new Set())
  const [repliedFilter, setRepliedFilter] = useState<Set<string>>(new Set(['not', 'auto', 'manual']))
  const [hasComments, setHasComments] = useState<'all' | 'yes' | 'no'>('all')
  const [showTotal, setShowTotal] = useState(true)

  // Count active filters for badge
  const activeFilterCount = [
    selectedPlatforms.size > 0,
    selectedSentiments.size > 0,
    selectedKeywords.size > 0,
    selectedKwTypes.size > 0,
    repliedFilter.size < 3,
    hasComments !== 'all',
    relevanceRange[0] > 0 || relevanceRange[1] < 100,
    scoreRange[0] > 0 || scoreRange[1] < 50000,
  ].filter(Boolean).length

  // Auto-determine grouping based on date range, but allow manual override
  const recommendedGrouping = useMemo(() => getRecommendedGrouping(dateFrom, dateTo), [dateFrom, dateTo])
  const availableGroupings = useMemo(() => getAvailableGroupings(dateFrom, dateTo), [dateFrom, dateTo])
  const [groupBy, setGroupBy] = useState<GroupBy>(recommendedGrouping)

  // Update groupBy when date range changes if current groupBy is not available
  useMemo(() => {
    if (!availableGroupings.includes(groupBy)) {
      setGroupBy(recommendedGrouping)
    }
  }, [availableGroupings, groupBy, recommendedGrouping])

  // Select data source based on grouping (hourly vs daily)
  const isHourly = groupBy === 'hour'
  
  // Filter data by selected date range
  const filterByDateRange = (data: any[]) => {
    return data.filter(d => {
      try {
        const itemDate = new Date(d.date)
        return itemDate >= dateFrom && itemDate <= dateTo
      } catch {
        return true // Keep if can't parse
      }
    })
  }
  
  const sourceDataMentions = isHourly 
    ? filterByDateRange(mentionsByHour)
    : filterByDateRange(mentionsByDay)
  const sourceDataPlatforms = isHourly 
    ? filterByDateRange(mentionsByPlatformByHour)
    : filterByDateRange(mentionsByPlatformOverTime)
  const sourceDataReach = isHourly 
    ? filterByDateRange(reachScoreByPlatformByHour)
    : filterByDateRange(reachScoreByPlatform)

  // Aggregate data based on selected grouping
  const aggregatedMentionsByDay = useMemo(
    () => aggregateData(sourceDataMentions, groupBy, dateFrom, dateTo),
    [sourceDataMentions, groupBy, dateFrom, dateTo]
  )

  // Add total field to sentiment chart data
  const mentionsByDayWithTotal = useMemo(
    () => aggregatedMentionsByDay.map((d: any) => ({
      ...d,
      total: (d.positive || 0) + (d.neutral || 0) + (d.negative || 0) + (d.question || 0),
    })),
    [aggregatedMentionsByDay]
  )

  const aggregatedMentionsByPlatform = useMemo(
    () => aggregateData(sourceDataPlatforms, groupBy, dateFrom, dateTo),
    [sourceDataPlatforms, groupBy, dateFrom, dateTo]
  )

  // Add total field to platform chart data
  const platformKeys = Object.keys(CHART_PLATFORM_COLORS)
  const mentionsByPlatformWithTotal = useMemo(
    () => aggregatedMentionsByPlatform.map((d: any) => ({
      ...d,
      total: platformKeys.reduce((sum, k) => sum + ((d[k] as number) || 0), 0),
    })),
    [aggregatedMentionsByPlatform]
  )

  const aggregatedReachScore = useMemo(
    () => aggregateData(sourceDataReach, groupBy, dateFrom, dateTo),
    [sourceDataReach, groupBy, dateFrom, dateTo]
  )

  // Add total field to reach score chart data
  const reachScoreWithTotal = useMemo(
    () => aggregatedReachScore.map((d: any) => ({
      ...d,
      total: platformKeys.reduce((sum, k) => sum + ((d[k] as number) || 0), 0),
    })),
    [aggregatedReachScore]
  )

  // Activity (comments: auto + manual)
  const sourceDataActivity = isHourly
    ? filterByDateRange(activityByHour)
    : filterByDateRange(activityByDay)
  const aggregatedActivity = useMemo(
    () => aggregateData(sourceDataActivity, groupBy, dateFrom, dateTo),
    [sourceDataActivity, groupBy, dateFrom, dateTo]
  )
  const totalComments = aggregatedActivity.reduce((sum, d) => sum + ((d.auto as number) || 0) + ((d.manual as number) || 0), 0)

  const handleDayClick = (day: Date) => {
    if (dateTo && dateFrom && dateFrom.getTime() !== dateTo.getTime()) {
      setDateFrom(day); setDateTo(day)
    } else {
      if (day < dateFrom) { setDateTo(dateFrom); setDateFrom(day) }
      else setDateTo(day)
    }
  }

  const handleSentimentLegendClick = (dataKey: string) => {
    setActiveSentiments((prev) => {
      const next = new Set(prev)
      if (next.has(dataKey)) next.delete(dataKey)
      else next.add(dataKey)
      return next
    })
  }

  const handlePlatformLegendClick = (dataKey: string) => {
    setActivePlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(dataKey)) next.delete(dataKey)
      else next.add(dataKey)
      return next
    })
  }

  const handleReachPlatformLegendClick = (dataKey: string) => {
    setActiveReachPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(dataKey)) next.delete(dataKey)
      else next.add(dataKey)
      return next
    })
  }

  return (
    <>
      <Header fixed>
        <BarChart3 className='size-4 text-muted-foreground' />
        <h1 className='text-sm font-semibold'>Reports</h1>

        {/* Date picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button className='inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium hover:bg-muted'>
              <CalendarIcon className='size-3' />
              {format(dateFrom, 'MMM d')} – {format(dateTo, 'MMM d')}
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <DateRangePresets from={dateFrom} onSelect={(f, t) => { setDateFrom(f); setDateTo(t) }} />
            <Calendar
              mode='single'
              modifiers={{ range_start: [dateFrom], range_end: [dateTo], range_middle: { after: dateFrom, before: dateTo } }}
              modifiersClassNames={{ range_start: 'bg-primary text-primary-foreground rounded-l-md', range_end: 'bg-primary text-primary-foreground rounded-r-md', range_middle: 'bg-accent text-accent-foreground rounded-none' }}
              onDayClick={handleDayClick}
              disabled={(d) => d > new Date()}
              numberOfMonths={2}
              defaultMonth={dateFrom}
            />
          </PopoverContent>
        </Popover>

        {/* Grouping tabs (day/week/month) next to date */}
        {availableGroupings.length > 1 && (
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <TabsList className='h-7'>
              {availableGroupings.includes('hour') && <TabsTrigger value='hour' className='h-6 px-2 text-[11px]'>Hour</TabsTrigger>}
              {availableGroupings.includes('day') && <TabsTrigger value='day' className='h-6 px-2 text-[11px]'>Day</TabsTrigger>}
              {availableGroupings.includes('week') && <TabsTrigger value='week' className='h-6 px-2 text-[11px]'>Week</TabsTrigger>}
              {availableGroupings.includes('month') && <TabsTrigger value='month' className='h-6 px-2 text-[11px]'>Month</TabsTrigger>}
            </TabsList>
          </Tabs>
        )}

        {/* Filters in header */}
        <Popover>
          <PopoverTrigger asChild>
            <button className='inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted'>
              <Filter className='size-3' />
              Filters
              {activeFilterCount > 0 && (
                <span className='flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-80 max-h-[70vh] overflow-y-auto p-3' align='start'>
            <div className='space-y-4'>
              {/* Platforms */}
              <FilterSection label='Platforms'>
                <div className='flex flex-wrap gap-1'>
                  {['telegram', 'reddit', 'youtube', 'x', 'instagram', 'facebook', 'tiktok', 'web'].map((p) => (
                    <button key={p} type='button' onClick={() => { setSelectedPlatforms((prev) => { const next = new Set(prev); next.has(p) ? next.delete(p) : next.add(p); return next }) }}
                      className={cn('flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition-colors', selectedPlatforms.has(p) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                      <PlatformIcon platform={p as PlatformId} size='sm' />
                      <span className='capitalize'>{p}</span>
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Sentiments */}
              <FilterSection label='Sentiment'>
                <div className='flex flex-wrap gap-1'>
                  {[{ id: 'positive', label: 'Positive', cls: 'text-green-600 border-green-500/30 bg-green-500/10' }, { id: 'neutral', label: 'Neutral', cls: 'text-amber-600 border-amber-500/30 bg-amber-500/10' }, { id: 'negative', label: 'Negative', cls: 'text-red-600 border-red-500/30 bg-red-500/10' }, { id: 'question', label: 'Question', cls: 'text-purple-600 border-purple-500/30 bg-purple-500/10' }].map(({ id, label, cls }) => (
                    <button key={id} type='button' onClick={() => { setSelectedSentiments((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next }) }}
                      className={cn('rounded-full border px-2 py-1 text-[11px] transition-colors', selectedSentiments.has(id) ? cls : 'border-border text-muted-foreground hover:text-foreground')}>
                      {label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Keywords */}
              <FilterSection label='Keywords'>
                <div className='max-h-28 space-y-1 overflow-y-auto'>
                  {keywordPerformance.map((kw) => (
                    <label key={kw.keyword} className='flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-accent'>
                      <Checkbox checked={selectedKeywords.has(kw.keyword)} onCheckedChange={(checked) => { setSelectedKeywords((prev) => { const next = new Set(prev); if (checked) next.add(kw.keyword); else next.delete(kw.keyword); return next }) }} />
                      <span className='truncate'>{kw.keyword}</span>
                      <span className='ml-auto text-[10px] text-muted-foreground'>{kw.mentions}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Keyword Type */}
              <FilterSection label='Keyword Type'>
                <div className='flex gap-1'>
                  {[{ id: 'brand', label: 'Brand' }, { id: 'competitor', label: 'Competitor' }, { id: 'general', label: 'General' }].map(({ id, label }) => (
                    <button key={id} type='button' onClick={() => { setSelectedKwTypes((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next }) }}
                      className={cn('rounded-full border px-2.5 py-1 text-[11px] transition-colors', selectedKwTypes.has(id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                      {label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Reply Status */}
              <FilterSection label='Reply Status'>
                <div className='flex gap-1'>
                  {[{ id: 'not', label: 'Not Replied' }, { id: 'auto', label: 'Auto' }, { id: 'manual', label: 'Manual' }].map(({ id, label }) => (
                    <button key={id} type='button' onClick={() => { setRepliedFilter((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next }) }}
                      className={cn('rounded-full border px-2.5 py-1 text-[11px] transition-colors', repliedFilter.has(id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                      {label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Has Comments */}
              <FilterSection label='Comments'>
                <div className='flex gap-1'>
                  {[{ id: 'all' as const, label: 'All' }, { id: 'yes' as const, label: 'With' }, { id: 'no' as const, label: 'Without' }].map(({ id, label }) => (
                    <button key={id} type='button' onClick={() => setHasComments(id)}
                      className={cn('rounded-full border px-2.5 py-1 text-[11px] transition-colors', hasComments === id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                      {label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Relevance */}
              <FilterSection label={`Relevance: ${relevanceRange[0]}–${relevanceRange[1]}`}>
                <RangeSliderWithInput min={0} max={100} step={1} value={relevanceRange} onValueChange={setRelevanceRange} />
              </FilterSection>

              {/* Reach Score */}
              <FilterSection label={`Reach Score: ${scoreRange[0].toLocaleString()}–${scoreRange[1].toLocaleString()}`}>
                <RangeSliderWithInput min={0} max={50000} step={100} value={scoreRange} onValueChange={setScoreRange} />
              </FilterSection>
            </div>
          </PopoverContent>
        </Popover>

        <div className='ms-auto flex items-center gap-2'>
          <label className='inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium'>
            <Checkbox checked={showTotal} onCheckedChange={(checked) => setShowTotal(checked === true)} className='size-3.5' />
            <span>Total</span>
          </label>
          <Button variant='outline' size='sm' className='h-8 gap-1.5'>
            <Download className='size-3.5' />
            <span className='hidden sm:inline'>Export</span>
          </Button>
          <ThemeSwitch />
          <span className='hidden sm:inline-flex'><ProfileDropdown /></span>
        </div>
      </Header>

      <Main>
        <PageDescription
          id='reports-page'
          summary='Reports show analytics for your mentions over time: volume trends, sentiment breakdown, platform distribution, and reach scores.'
          details='Use the date range and grouping options in the header to adjust the view. Filter by platform, sentiment, or relevance to focus on specific segments. Export data from Settings → Access & Export.'
          helpAnchor='reports'
          className='mb-4'
        />

        {/* Active filter badges */}
        {activeFilterCount > 0 && (
          <div className='mb-4 flex flex-wrap items-center gap-1.5'>
            {selectedPlatforms.size > 0 && (
              <FilterBadge label={`${selectedPlatforms.size} platform${selectedPlatforms.size > 1 ? 's' : ''}`} onClear={() => setSelectedPlatforms(new Set())} />
            )}
            {selectedSentiments.size > 0 && (
              <FilterBadge label={`${selectedSentiments.size} sentiment${selectedSentiments.size > 1 ? 's' : ''}`} onClear={() => setSelectedSentiments(new Set())} />
            )}
            {Array.from(selectedKeywords).map((kw) => (
              <FilterBadge key={kw} label={kw} onClear={() => setSelectedKeywords((prev) => { const next = new Set(prev); next.delete(kw); return next })} />
            ))}
            {selectedKwTypes.size > 0 && (
              <FilterBadge label={Array.from(selectedKwTypes).join(', ')} onClear={() => setSelectedKwTypes(new Set())} />
            )}
            {repliedFilter.size < 3 && (
              <FilterBadge label={`Replied: ${Array.from(repliedFilter).join(', ')}`} onClear={() => setRepliedFilter(new Set(['not', 'auto', 'manual']))} />
            )}
            {hasComments !== 'all' && (
              <FilterBadge label={`Comments: ${hasComments}`} onClear={() => setHasComments('all')} />
            )}
            {(relevanceRange[0] > 0 || relevanceRange[1] < 100) && (
              <FilterBadge label={`Relevance: ${relevanceRange[0]}–${relevanceRange[1]}`} onClear={() => setRelevanceRange([0, 100])} />
            )}
            {(scoreRange[0] > 0 || scoreRange[1] < 50000) && (
              <FilterBadge label={`Score: ${scoreRange[0]}–${scoreRange[1]}`} onClear={() => setScoreRange([0, 50000])} />
            )}
          </div>
        )}

        {/* ── Row 2: Platform pie + Sentiment pie ───────────────────────── */}
        <div className='grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm'>Mentions Over Time</CardTitle>
                <div className='flex items-center gap-2'>
                  <span className='text-lg font-semibold tabular-nums'>{summary.totalMentions.toLocaleString()}</span>
                  <ChangeBadge change={+12.4} />
                </div>
              </div>
              <CardDescription className='text-xs'>Breakdown by sentiment</CardDescription>
            </CardHeader>
            <CardContent className='pt-0'>
              <ResponsiveContainer width='100%' height={220}>
                <AreaChart data={mentionsByDayWithTotal}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                  <XAxis dataKey='date' tick={{ fontSize: 10 }} interval='preserveStartEnd' className='fill-muted-foreground' />
                  <YAxis tick={{ fontSize: 10 }} className='fill-muted-foreground' allowDecimals={false} width={30} />
                  <RTooltip contentStyle={TOOLTIP_STYLE} wrapperStyle={TOOLTIP_WRAPPER_STYLE} />
                  <Legend 
                    wrapperStyle={{ fontSize: 11, cursor: 'pointer' }} 
                    onClick={(e) => handleSentimentLegendClick(e.dataKey as string)}
                    formatter={(value: string, entry: any) => {
                      const total = mentionsByDayWithTotal.reduce((sum, d) => sum + (d[entry.dataKey as keyof typeof d] as number || 0), 0)
                      const grandTotal = mentionsByDayWithTotal.reduce((sum, d) => sum + (d.positive as number || 0) + (d.neutral as number || 0) + (d.negative as number || 0) + (d.question as number || 0), 0)
                      const pct = Math.round((total / grandTotal) * 100)
                      const isActive = activeSentiments.has(entry.dataKey)
                      const hasActive = activeSentiments.size > 0
                      const opacity = hasActive && !isActive ? 0.4 : 1
                      return <span style={{ opacity }}>{value} ({total}, {pct}%)</span>
                    }}
                  />
                  <Area type='monotone' dataKey='positive' name='Positive' fill='#22c55e' stroke='#22c55e' fillOpacity={activeSentiments.size === 0 || activeSentiments.has('positive') ? 0.3 : 0.05} strokeOpacity={activeSentiments.size === 0 || activeSentiments.has('positive') ? 1 : 0.3} strokeWidth={2} />
                  <Area type='monotone' dataKey='neutral' name='Neutral' fill='#f59e0b' stroke='#f59e0b' fillOpacity={activeSentiments.size === 0 || activeSentiments.has('neutral') ? 0.3 : 0.05} strokeOpacity={activeSentiments.size === 0 || activeSentiments.has('neutral') ? 1 : 0.3} strokeWidth={2} />
                  <Area type='monotone' dataKey='negative' name='Negative' fill='#ef4444' stroke='#ef4444' fillOpacity={activeSentiments.size === 0 || activeSentiments.has('negative') ? 0.3 : 0.05} strokeOpacity={activeSentiments.size === 0 || activeSentiments.has('negative') ? 1 : 0.3} strokeWidth={2} />
                  <Area type='monotone' dataKey='question' name='Question' fill='#a855f7' stroke='#a855f7' fillOpacity={activeSentiments.size === 0 || activeSentiments.has('question') ? 0.3 : 0.05} strokeOpacity={activeSentiments.size === 0 || activeSentiments.has('question') ? 1 : 0.3} strokeWidth={2} />
                  {showTotal && <Line type='monotone' dataKey='total' name='Total' stroke='#334155' strokeWidth={2.5} strokeDasharray='5 3' dot={false} />}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm'>Mentions by Platform</CardTitle>
                <div className='flex items-center gap-2'>
                  <span className='text-lg font-semibold tabular-nums'>{summary.totalMentions.toLocaleString()}</span>
                  <ChangeBadge change={+12.4} />
                </div>
              </div>
              <CardDescription className='text-xs'>Breakdown by social network</CardDescription>
            </CardHeader>
            <CardContent className='pt-0'>
              <ResponsiveContainer width='100%' height={220}>
                <AreaChart data={mentionsByPlatformWithTotal}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                  <XAxis dataKey='date' tick={{ fontSize: 10 }} interval='preserveStartEnd' className='fill-muted-foreground' />
                  <YAxis tick={{ fontSize: 10 }} className='fill-muted-foreground' allowDecimals={false} width={30} />
                  <RTooltip contentStyle={TOOLTIP_STYLE} wrapperStyle={TOOLTIP_WRAPPER_STYLE} />
                  <Legend 
                    wrapperStyle={{ fontSize: 11, cursor: 'pointer' }} 
                    onClick={(e) => handlePlatformLegendClick(e.dataKey as string)}
                    formatter={(value: string, entry: any) => {
                      const total = mentionsByPlatformWithTotal.reduce((sum, d) => sum + (d[entry.dataKey as keyof typeof d] as number || 0), 0)
                      const grandTotal = mentionsByPlatformWithTotal.reduce((sum, d) => sum + (d.telegram as number || 0) + (d.reddit as number || 0) + (d.youtube as number || 0) + (d.x as number || 0) + (d.instagram as number || 0) + (d.facebook as number || 0) + (d.tiktok as number || 0) + (d.web as number || 0), 0)
                      const pct = Math.round((total / grandTotal) * 100)
                      const isActive = activePlatforms.has(entry.dataKey)
                      const hasActive = activePlatforms.size > 0
                      const opacity = hasActive && !isActive ? 0.4 : 1
                      return <span style={{ opacity }}>{value} ({total}, {pct}%)</span>
                    }}
                  />
                  {Object.entries(CHART_PLATFORM_COLORS).map(([key, color]) => (
                    <Area key={key} type='monotone' dataKey={key} name={key.charAt(0).toUpperCase() + key.slice(1)} fill={color} stroke={color} fillOpacity={activePlatforms.size === 0 || activePlatforms.has(key) ? 0.3 : 0.05} strokeOpacity={activePlatforms.size === 0 || activePlatforms.has(key) ? 1 : 0.3} strokeWidth={2} />
                  ))}
                  {showTotal && <Line type='monotone' dataKey='total' name='Total' stroke='#334155' strokeWidth={2.5} strokeDasharray='5 3' dot={false} />}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: Reach Score by Platform ────────────────────────────── */}
        <Card className='mt-4'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm'>Reach Score by Platform</CardTitle>
              <div className='flex items-center gap-2'>
                <span className='text-lg font-semibold tabular-nums'>{summary.totalReachScore.toLocaleString()}</span>
                <ChangeBadge change={+18.7} />
              </div>
            </div>
            <CardDescription className='text-xs'>Total reach score breakdown by social network</CardDescription>
          </CardHeader>
          <CardContent className='pt-0'>
            <ResponsiveContainer width='100%' height={220}>
              <AreaChart data={reachScoreWithTotal}>
                <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                <XAxis dataKey='date' tick={{ fontSize: 10 }} interval='preserveStartEnd' className='fill-muted-foreground' />
                <YAxis tick={{ fontSize: 10 }} className='fill-muted-foreground' allowDecimals={false} width={40} />
                <RTooltip contentStyle={TOOLTIP_STYLE} wrapperStyle={TOOLTIP_WRAPPER_STYLE} />
                <Legend 
                  wrapperStyle={{ fontSize: 11, cursor: 'pointer' }} 
                  onClick={(e) => handleReachPlatformLegendClick(e.dataKey as string)}
                  formatter={(value: string, entry: any) => {
                    const total = reachScoreWithTotal.reduce((sum, d) => sum + (d[entry.dataKey as keyof typeof d] as number || 0), 0)
                    const grandTotal = reachScoreWithTotal.reduce((sum, d) => sum + (d.telegram as number || 0) + (d.reddit as number || 0) + (d.youtube as number || 0) + (d.x as number || 0) + (d.instagram as number || 0) + (d.facebook as number || 0) + (d.tiktok as number || 0) + (d.web as number || 0), 0)
                    const pct = Math.round((total / grandTotal) * 100)
                    const isActive = activeReachPlatforms.has(entry.dataKey)
                    const hasActive = activeReachPlatforms.size > 0
                    const opacity = hasActive && !isActive ? 0.4 : 1
                    return <span style={{ opacity }}>{value} ({total.toLocaleString()}, {pct}%)</span>
                  }}
                />
                {Object.entries(CHART_PLATFORM_COLORS).map(([key, color]) => (
                  <Area key={key} type='monotone' dataKey={key} name={key.charAt(0).toUpperCase() + key.slice(1)} fill={color} stroke={color} fillOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has(key) ? 0.3 : 0.05} strokeOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has(key) ? 1 : 0.3} strokeWidth={2} />
                ))}
                {showTotal && <Line type='monotone' dataKey='total' name='Total' stroke='#334155' strokeWidth={2.5} strokeDasharray='5 3' dot={false} />}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Comments Count (Auto vs Manual) ───────────────────────────── */}
        <Card className='mt-4'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm'>Comments Count</CardTitle>
              <div className='flex items-center gap-2'>
                <span className='text-lg font-semibold tabular-nums'>{totalComments.toLocaleString()}</span>
                <ChangeBadge change={+8.2} />
              </div>
            </div>
            <CardDescription className='text-xs'>Auto vs manual comments over time</CardDescription>
          </CardHeader>
          <CardContent className='pt-0'>
            <ResponsiveContainer width='100%' height={220}>
              <AreaChart data={aggregatedActivity}>
                <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                <XAxis dataKey='date' tick={{ fontSize: 10 }} interval='preserveStartEnd' className='fill-muted-foreground' />
                <YAxis tick={{ fontSize: 10 }} className='fill-muted-foreground' allowDecimals={false} width={30} />
                <RTooltip contentStyle={TOOLTIP_STYLE} wrapperStyle={TOOLTIP_WRAPPER_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type='monotone' dataKey='auto' name='Auto' fill='#8B5CF6' stroke='#8B5CF6' fillOpacity={0.3} strokeWidth={2} />
                <Area type='monotone' dataKey='manual' name='Manual' fill='#06B6D4' stroke='#06B6D4' fillOpacity={0.3} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Row 4: Engagement funnel + Keyword performance ────────────── */}
        <div className='mt-4 grid gap-4 lg:grid-cols-5'>
          <Card className='lg:col-span-2'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>Engagement Funnel</CardTitle>
              <CardDescription className='text-xs'>From discovery to response</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {engagementFunnel.map((step, i) => {
                  const maxCount = engagementFunnel[0].count
                  const pct = Math.round((step.count / maxCount) * 100)
                  const dropoff = i > 0 ? Math.round(((engagementFunnel[i - 1].count - step.count) / engagementFunnel[i - 1].count) * 100) : 0
                  return (
                    <div key={step.stage}>
                      <div className='mb-1 flex items-center justify-between'>
                        <span className='text-xs'>{step.stage}</span>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs font-medium tabular-nums'>{step.count.toLocaleString()}</span>
                          {i > 0 && <span className='text-[10px] text-red-500'>−{dropoff}%</span>}
                        </div>
                      </div>
                      <div className='h-2 rounded-full bg-muted'>
                        <div className='h-2 rounded-full bg-primary transition-all' style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className='lg:col-span-3'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>Keyword Performance</CardTitle>
              <CardDescription className='text-xs'>Mentions, relevance & auto-reply rate per keyword</CardDescription>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow className='text-xs'>
                    <TableHead>Keyword</TableHead>
                    <TableHead className='text-right'>Mentions</TableHead>
                    <TableHead className='text-right'>Avg Rel.</TableHead>
                    <TableHead className='text-right'>Auto-Replied</TableHead>
                    <TableHead className='hidden text-center sm:table-cell'>Sentiment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywordPerformance.map((kw) => {
                    const replyRate = Math.round((kw.autoReplied / kw.mentions) * 100)
                    return (
                      <TableRow key={kw.keyword}>
                        <TableCell className='py-2 text-sm font-medium'>{kw.keyword}</TableCell>
                        <TableCell className='py-2 text-right text-xs tabular-nums'>{kw.mentions}</TableCell>
                        <TableCell className='py-2 text-right text-xs tabular-nums'>{kw.avgRelevance}%</TableCell>
                        <TableCell className='py-2 text-right'>
                          <span className='text-xs tabular-nums'>{kw.autoReplied}</span>
                          <span className='ml-1 text-[10px] text-muted-foreground'>({replyRate}%)</span>
                        </TableCell>
                        <TableCell className='hidden py-2 sm:table-cell'>
                          <div className='flex justify-center gap-0.5'>
                            {Object.entries(kw.sentiment).map(([s, pct]) => (
                              <Tooltip key={s}>
                                <TooltipTrigger asChild>
                                  <div
                                    className='h-3 min-w-1 rounded-sm'
                                    style={{ width: `${pct}%`, backgroundColor: SENTIMENT_COLORS[s], maxWidth: 40 }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent className='text-xs capitalize'>{s}: {pct}%</TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 4: Top 10 authors ─────────────────────────────────────── */}
        <Card className='mt-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Top 10 Influencers / Channels</CardTitle>
            <CardDescription className='text-xs'>By total reach score in the selected period</CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow className='text-xs'>
                  <TableHead className='w-10'>#</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className='hidden sm:table-cell'>Platform</TableHead>
                  <TableHead className='text-right'>Reach Score</TableHead>
                  <TableHead className='hidden text-right md:table-cell'>Mentions</TableHead>
                  <TableHead className='hidden text-right md:table-cell'>Avg Rel.</TableHead>
                  <TableHead className='w-[120px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {topAuthors.map((a) => {
                  const maxScore = topAuthors[0].totalScore
                  return (
                    <TableRow key={a.rank}>
                      <TableCell className='py-2 text-xs font-medium text-muted-foreground'>{a.rank}</TableCell>
                      <TableCell className='py-2 text-sm font-medium'>{a.author}</TableCell>
                      <TableCell className='hidden py-2 sm:table-cell'>
                        <div className='flex items-center gap-1.5'>
                          <PlatformIcon platform={a.platform as PlatformId} size='sm' />
                          <span className='text-xs capitalize text-muted-foreground'>{a.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell className='py-2 text-right text-xs font-medium tabular-nums'>{a.totalScore.toLocaleString()}</TableCell>
                      <TableCell className='hidden py-2 text-right text-xs tabular-nums text-muted-foreground md:table-cell'>{a.mentions}</TableCell>
                      <TableCell className='hidden py-2 text-right text-xs tabular-nums text-muted-foreground md:table-cell'>{a.avgRelevance}%</TableCell>
                      <TableCell className='py-2'>
                        <div className='h-2 rounded-full bg-muted'>
                          <div className='h-2 rounded-full bg-primary' style={{ width: `${(a.totalScore / maxScore) * 100}%` }} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ── Row 4: Top 10 authors ─────────────────────────────────────── */}
        <Card className='mt-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Peak Mention Hours</CardTitle>
            <CardDescription className='text-xs'>When mentions appear most — optimize your auto-reply schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <div className='min-w-[600px]'>
                {/* Hour labels */}
                <div className='mb-1 flex'>
                  <div className='w-10 shrink-0' />
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className='flex-1 text-center text-[9px] text-muted-foreground'>
                      {h % 3 === 0 ? `${h}` : ''}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className='flex items-center gap-0.5'>
                    <div className='w-10 shrink-0 text-[10px] text-muted-foreground'>{day}</div>
                    {Array.from({ length: 24 }, (_, h) => {
                      const cell = peakHoursData.find((c) => c.day === day && c.hour === h)
                      const count = cell?.count ?? 0
                      const maxCount = Math.max(...peakHoursData.map((c) => c.count))
                      const intensity = maxCount > 0 ? count / maxCount : 0
                      return (
                        <Tooltip key={h}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'aspect-square flex-1 rounded-sm',
                                intensity === 0 && 'bg-muted',
                                intensity > 0 && intensity <= 0.2 && 'bg-primary/15',
                                intensity > 0.2 && intensity <= 0.4 && 'bg-primary/30',
                                intensity > 0.4 && intensity <= 0.6 && 'bg-primary/50',
                                intensity > 0.6 && intensity <= 0.8 && 'bg-primary/70',
                                intensity > 0.8 && 'bg-primary/90',
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent className='text-xs'>{day} {h}:00 — {count} mentions</TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}


// ─── Change Badge ────────────────────────────────────────────────────────────

function ChangeBadge({ change }: { change: number }) {
  const up = change >= 0
  return (
    <Badge
      variant='outline'
      className={cn(
        'gap-0.5 text-[10px]',
        up ? 'text-green-600 border-green-500/30' : 'text-red-600 border-red-500/30'
      )}
    >
      {up ? <ArrowUpRight className='!size-3' /> : <ArrowDownRight className='!size-3' />}
      {Math.abs(change)}%
    </Badge>
  )
}

// ─── Filter Helpers ──────────────────────────────────────────────────────────

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className='mb-1.5 text-xs font-medium text-muted-foreground'>{label}</p>
      {children}
    </div>
  )
}

function FilterBadge({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className='inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
      {label}
      <button className='ml-0.5 text-primary/60 hover:text-primary' onClick={onClear}>×</button>
    </span>
  )
}
