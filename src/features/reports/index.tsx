import { useState, useMemo } from 'react'
import { format, subDays, differenceInDays } from 'date-fns'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarIcon,
  Download,
  Filter,
  MessageSquare,
  Radio,
  SmilePlus,
  TrendingUp,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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
import { Slider } from '@/components/ui/slider'
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
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { PlatformIcon, type PlatformId } from '@/components/platform-icon'
import { DateRangePresets } from '@/components/shared/date-range-presets'
import { aggregateData, type GroupBy } from './data-aggregation'
import {
  mentionsByDay,
  mentionsByHour,
  mentionsByPlatformOverTime,
  mentionsByPlatformByHour,
  reachScoreByPlatform,
  reachScoreByPlatformByHour,
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

  // ── Mock filter state (Task 5) ─────────────────────────────────────────────
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [relevanceRange, setRelevanceRange] = useState<[number, number]>([0, 100])

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
  const aggregatedMentionsByPlatform = useMemo(
    () => aggregateData(sourceDataPlatforms, groupBy, dateFrom, dateTo),
    [sourceDataPlatforms, groupBy, dateFrom, dateTo]
  )
  const aggregatedReachScore = useMemo(
    () => aggregateData(sourceDataReach, groupBy, dateFrom, dateTo),
    [sourceDataReach, groupBy, dateFrom, dateTo]
  )

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

        <div className='ms-auto flex items-center gap-2'>
          <Button variant='outline' size='sm' className='h-8 gap-1.5'>
            <Download className='size-3.5' />
            <span className='hidden sm:inline'>Export</span>
          </Button>
          <ThemeSwitch />
          <span className='hidden sm:inline-flex'><ProfileDropdown /></span>
        </div>
      </Header>

      <Main>
        {/* ── Filter Bar (mock keyword/relevance) ────────────────────────── */}
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          {/* Keyword multi-select */}
          <Popover>
            <PopoverTrigger asChild>
              <button className='inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted'>
                <Filter className='size-3' />
                Keywords
                {selectedKeywords.size > 0 && (
                  <span className='flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
                    {selectedKeywords.size}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-56 p-2' align='start'>
              <div className='space-y-1'>
                {keywordPerformance.map((kw) => (
                  <label
                    key={kw.keyword}
                    className='flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent'
                  >
                    <Checkbox
                      checked={selectedKeywords.has(kw.keyword)}
                      onCheckedChange={(checked) => {
                        setSelectedKeywords((prev) => {
                          const next = new Set(prev)
                          if (checked) next.add(kw.keyword)
                          else next.delete(kw.keyword)
                          return next
                        })
                      }}
                    />
                    <span className='truncate'>{kw.keyword}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Relevance range slider */}
          <Popover>
            <PopoverTrigger asChild>
              <button className='inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted'>
                <Zap className='size-3' />
                Relevance {relevanceRange[0]}–{relevanceRange[1]}
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-64 p-4' align='start'>
              <div className='space-y-3'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>Min: {relevanceRange[0]}</span>
                  <span>Max: {relevanceRange[1]}</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={relevanceRange}
                  onValueChange={(v) => setRelevanceRange(v as [number, number])}
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Active filter badges */}
          {selectedKeywords.size > 0 && (
            Array.from(selectedKeywords).map((kw) => (
              <span
                key={kw}
                className='inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
              >
                {kw}
                <button
                  className='ml-0.5 text-primary/60 hover:text-primary'
                  onClick={() => setSelectedKeywords((prev) => {
                    const next = new Set(prev)
                    next.delete(kw)
                    return next
                  })}
                >
                  ×
                </button>
              </span>
            ))
          )}
          {(relevanceRange[0] > 0 || relevanceRange[1] < 100) && (
            <span className='inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
              Relevance: {relevanceRange[0]}–{relevanceRange[1]}
              <button
                className='ml-0.5 text-primary/60 hover:text-primary'
                onClick={() => setRelevanceRange([0, 100])}
              >
                ×
              </button>
            </span>
          )}
        </div>

        {/* ── Grouping Selector ──────────────────────────────────────────── */}
        {availableGroupings.length > 1 && (
          <div className='mb-4'>
            <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <TabsList className='h-8'>
                {availableGroupings.includes('hour') && (
                  <TabsTrigger value='hour' className='h-7 text-xs'>
                    Hour
                  </TabsTrigger>
                )}
                {availableGroupings.includes('day') && (
                  <TabsTrigger value='day' className='h-7 text-xs'>
                    Day
                  </TabsTrigger>
                )}
                {availableGroupings.includes('week') && (
                  <TabsTrigger value='week' className='h-7 text-xs'>
                    Week
                  </TabsTrigger>
                )}
                {availableGroupings.includes('month') && (
                  <TabsTrigger value='month' className='h-7 text-xs'>
                    Month
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <KpiCard icon={TrendingUp} label='Total Mentions' value={summary.totalMentions} change={+12.4} dateFrom={dateFrom} dateTo={dateTo} />
          <KpiCard icon={MessageSquare} label='Our Comments' value={summary.totalComments} change={+8.2} dateFrom={dateFrom} dateTo={dateTo} />
          <KpiCard icon={SmilePlus} label='Our Reactions' value={summary.totalReactions} change={+23.1} dateFrom={dateFrom} dateTo={dateTo} />
          <KpiCard icon={Radio} label='Total Reach Score' value={summary.totalReachScore} change={+18.7} dateFrom={dateFrom} dateTo={dateTo} />
        </div>

        {/* ── Row 2: Platform pie + Sentiment pie ───────────────────────── */}
        <div className='mt-4 grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>Mentions Over Time</CardTitle>
              <CardDescription className='text-xs'>Breakdown by sentiment</CardDescription>
            </CardHeader>
            <CardContent className='pt-0'>
              <ResponsiveContainer width='100%' height={220}>
                <AreaChart data={aggregatedMentionsByDay}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                  <XAxis dataKey='date' tick={{ fontSize: 10 }} interval='preserveStartEnd' className='fill-muted-foreground' />
                  <YAxis tick={{ fontSize: 10 }} className='fill-muted-foreground' allowDecimals={false} width={30} />
                  <RTooltip contentStyle={TOOLTIP_STYLE} wrapperStyle={TOOLTIP_WRAPPER_STYLE} />
                  <Legend 
                    wrapperStyle={{ fontSize: 11, cursor: 'pointer' }} 
                    onClick={(e) => handleSentimentLegendClick(e.dataKey as string)}
                    formatter={(value: string, entry: any) => {
                      const total = aggregatedMentionsByDay.reduce((sum, d) => sum + (d[entry.dataKey as keyof typeof d] as number || 0), 0)
                      const grandTotal = aggregatedMentionsByDay.reduce((sum, d) => sum + (d.positive as number || 0) + (d.neutral as number || 0) + (d.negative as number || 0) + (d.question as number || 0), 0)
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
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>Mentions by Platform</CardTitle>
              <CardDescription className='text-xs'>Breakdown by social network</CardDescription>
            </CardHeader>
            <CardContent className='pt-0'>
              <ResponsiveContainer width='100%' height={220}>
                <AreaChart data={aggregatedMentionsByPlatform}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                  <XAxis dataKey='date' tick={{ fontSize: 10 }} interval='preserveStartEnd' className='fill-muted-foreground' />
                  <YAxis tick={{ fontSize: 10 }} className='fill-muted-foreground' allowDecimals={false} width={30} />
                  <RTooltip contentStyle={TOOLTIP_STYLE} wrapperStyle={TOOLTIP_WRAPPER_STYLE} />
                  <Legend 
                    wrapperStyle={{ fontSize: 11, cursor: 'pointer' }} 
                    onClick={(e) => handlePlatformLegendClick(e.dataKey as string)}
                    formatter={(value: string, entry: any) => {
                      const total = aggregatedMentionsByPlatform.reduce((sum, d) => sum + (d[entry.dataKey as keyof typeof d] as number || 0), 0)
                      const grandTotal = aggregatedMentionsByPlatform.reduce((sum, d) => sum + (d.telegram as number || 0) + (d.reddit as number || 0) + (d.youtube as number || 0) + (d.x as number || 0) + (d.instagram as number || 0) + (d.facebook as number || 0) + (d.tiktok as number || 0) + (d.web as number || 0), 0)
                      const pct = Math.round((total / grandTotal) * 100)
                      const isActive = activePlatforms.has(entry.dataKey)
                      const hasActive = activePlatforms.size > 0
                      const opacity = hasActive && !isActive ? 0.4 : 1
                      return <span style={{ opacity }}>{value} ({total}, {pct}%)</span>
                    }}
                  />
                  <Area type='monotone' dataKey='telegram' name='Telegram' fill='#26A5E4' stroke='#26A5E4' fillOpacity={activePlatforms.size === 0 || activePlatforms.has('telegram') ? 0.3 : 0.05} strokeOpacity={activePlatforms.size === 0 || activePlatforms.has('telegram') ? 1 : 0.3} strokeWidth={2} />
                  <Area type='monotone' dataKey='reddit' name='Reddit' fill='#FF4500' stroke='#FF4500' fillOpacity={activePlatforms.size === 0 || activePlatforms.has('reddit') ? 0.3 : 0.05} strokeOpacity={activePlatforms.size === 0 || activePlatforms.has('reddit') ? 1 : 0.3} strokeWidth={2} />
                  <Area type='monotone' dataKey='youtube' name='YouTube' fill='#FF0000' stroke='#FF0000' fillOpacity={activePlatforms.size === 0 || activePlatforms.has('youtube') ? 0.3 : 0.05} strokeOpacity={activePlatforms.size === 0 || activePlatforms.has('youtube') ? 1 : 0.3} strokeWidth={2} />
                  <Area type='monotone' dataKey='x' name='X' fill='#1DA1F2' stroke='#1DA1F2' fillOpacity={activePlatforms.size === 0 || activePlatforms.has('x') ? 0.3 : 0.05} strokeOpacity={activePlatforms.size === 0 || activePlatforms.has('x') ? 1 : 0.3} strokeWidth={2} />
                  <Area type='monotone' dataKey='instagram' name='Instagram' fill='#E4405F' stroke='#E4405F' fillOpacity={activePlatforms.size === 0 || activePlatforms.has('instagram') ? 0.3 : 0.05} strokeOpacity={activePlatforms.size === 0 || activePlatforms.has('instagram') ? 1 : 0.3} strokeWidth={2} />
                  <Area type='monotone' dataKey='facebook' name='Facebook' fill='#1877F2' stroke='#1877F2' fillOpacity={activePlatforms.size === 0 || activePlatforms.has('facebook') ? 0.3 : 0.05} strokeOpacity={activePlatforms.size === 0 || activePlatforms.has('facebook') ? 1 : 0.3} strokeWidth={2} />
                  <Area type='monotone' dataKey='tiktok' name='TikTok' fill='#EE1D52' stroke='#EE1D52' fillOpacity={activePlatforms.size === 0 || activePlatforms.has('tiktok') ? 0.3 : 0.05} strokeOpacity={activePlatforms.size === 0 || activePlatforms.has('tiktok') ? 1 : 0.3} strokeWidth={2} />
                  <Area type='monotone' dataKey='web' name='Web' fill='#6B7280' stroke='#6B7280' fillOpacity={activePlatforms.size === 0 || activePlatforms.has('web') ? 0.3 : 0.05} strokeOpacity={activePlatforms.size === 0 || activePlatforms.has('web') ? 1 : 0.3} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: Reach Score by Platform ────────────────────────────── */}
        <Card className='mt-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Reach Score by Platform</CardTitle>
            <CardDescription className='text-xs'>Total reach score breakdown by social network</CardDescription>
          </CardHeader>
          <CardContent className='pt-0'>
            <ResponsiveContainer width='100%' height={220}>
              <AreaChart data={aggregatedReachScore}>
                <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                <XAxis dataKey='date' tick={{ fontSize: 10 }} interval='preserveStartEnd' className='fill-muted-foreground' />
                <YAxis tick={{ fontSize: 10 }} className='fill-muted-foreground' allowDecimals={false} width={40} />
                <RTooltip contentStyle={TOOLTIP_STYLE} wrapperStyle={TOOLTIP_WRAPPER_STYLE} />
                <Legend 
                  wrapperStyle={{ fontSize: 11, cursor: 'pointer' }} 
                  onClick={(e) => handleReachPlatformLegendClick(e.dataKey as string)}
                  formatter={(value: string, entry: any) => {
                    const total = aggregatedReachScore.reduce((sum, d) => sum + (d[entry.dataKey as keyof typeof d] as number || 0), 0)
                    const grandTotal = aggregatedReachScore.reduce((sum, d) => sum + (d.telegram as number || 0) + (d.reddit as number || 0) + (d.youtube as number || 0) + (d.x as number || 0) + (d.instagram as number || 0) + (d.facebook as number || 0) + (d.tiktok as number || 0) + (d.web as number || 0), 0)
                    const pct = Math.round((total / grandTotal) * 100)
                    const isActive = activeReachPlatforms.has(entry.dataKey)
                    const hasActive = activeReachPlatforms.size > 0
                    const opacity = hasActive && !isActive ? 0.4 : 1
                    return <span style={{ opacity }}>{value} ({total.toLocaleString()}, {pct}%)</span>
                  }}
                />
                <Area type='monotone' dataKey='telegram' name='Telegram' fill='#26A5E4' stroke='#26A5E4' fillOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('telegram') ? 0.3 : 0.05} strokeOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('telegram') ? 1 : 0.3} strokeWidth={2} />
                <Area type='monotone' dataKey='reddit' name='Reddit' fill='#FF4500' stroke='#FF4500' fillOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('reddit') ? 0.3 : 0.05} strokeOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('reddit') ? 1 : 0.3} strokeWidth={2} />
                <Area type='monotone' dataKey='youtube' name='YouTube' fill='#FF0000' stroke='#FF0000' fillOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('youtube') ? 0.3 : 0.05} strokeOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('youtube') ? 1 : 0.3} strokeWidth={2} />
                <Area type='monotone' dataKey='x' name='X' fill='#1DA1F2' stroke='#1DA1F2' fillOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('x') ? 0.3 : 0.05} strokeOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('x') ? 1 : 0.3} strokeWidth={2} />
                <Area type='monotone' dataKey='instagram' name='Instagram' fill='#E4405F' stroke='#E4405F' fillOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('instagram') ? 0.3 : 0.05} strokeOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('instagram') ? 1 : 0.3} strokeWidth={2} />
                <Area type='monotone' dataKey='facebook' name='Facebook' fill='#1877F2' stroke='#1877F2' fillOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('facebook') ? 0.3 : 0.05} strokeOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('facebook') ? 1 : 0.3} strokeWidth={2} />
                <Area type='monotone' dataKey='tiktok' name='TikTok' fill='#EE1D52' stroke='#EE1D52' fillOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('tiktok') ? 0.3 : 0.05} strokeOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('tiktok') ? 1 : 0.3} strokeWidth={2} />
                <Area type='monotone' dataKey='web' name='Web' fill='#6B7280' stroke='#6B7280' fillOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('web') ? 0.3 : 0.05} strokeOpacity={activeReachPlatforms.size === 0 || activeReachPlatforms.has('web') ? 1 : 0.3} strokeWidth={2} />
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

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  change,
  dateFrom,
  dateTo,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  change: number
  dateFrom: Date
  dateTo: Date
}) {
  const up = change >= 0
  
  // Calculate previous period dates
  const daysDiff = differenceInDays(dateTo, dateFrom)
  const prevDateTo = subDays(dateFrom, 1)
  const prevDateFrom = subDays(prevDateTo, daysDiff)
  
  return (
    <Card>
      <CardContent className='flex items-center gap-4 p-4'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
          <Icon className='size-5 text-primary' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-xs text-muted-foreground'>{label}</p>
          <p className='text-xl font-semibold tabular-nums'>{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant='outline' className={cn('gap-0.5 text-[10px] cursor-help', up ? 'text-green-600 border-green-500/30' : 'text-red-600 border-red-500/30')}>
              {up ? <ArrowUpRight className='!size-3' /> : <ArrowDownRight className='!size-3' />}
              {Math.abs(change)}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent className='text-xs'>
            <div className='space-y-1'>
              <div>Compared to previous period</div>
              <div className='text-[10px] text-muted-foreground'>
                {format(prevDateFrom, 'MMM d')} – {format(prevDateTo, 'MMM d, yyyy')}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  )
}
