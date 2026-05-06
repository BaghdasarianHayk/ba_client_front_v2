import { 
  startOfWeek, 
  startOfMonth, 
  format, 
  eachWeekOfInterval, 
  eachMonthOfInterval,
  eachHourOfInterval,
  parseISO,
  isWithinInterval,
  differenceInDays,
} from 'date-fns'

export type GroupBy = 'hour' | 'day' | 'week' | 'month'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyDataPoint {
  date: string
  [key: string]: string | number
}

interface AggregatedDataPoint {
  date: string
  label: string
  [key: string]: string | number
}

// ─── Aggregation Functions ───────────────────────────────────────────────────

/**
 * Aggregates daily data into weeks or months
 * Properly handles SUM for counts and AVERAGE for rates/percentages
 */
export function aggregateData(
  dailyData: DailyDataPoint[],
  groupBy: GroupBy,
  dateFrom: Date,
  dateTo: Date
): AggregatedDataPoint[] {
  if (groupBy === 'hour' || groupBy === 'day') {
    // No aggregation needed, just format for display
    return dailyData.map(d => ({
      ...d,
      date: d.dateLabel || d.date, // Use dateLabel if available, otherwise date
      label: d.dateLabel || d.date,
    }))
  }

  if (groupBy === 'week') {
    return aggregateByWeek(dailyData, dateFrom, dateTo)
  }

  if (groupBy === 'month') {
    return aggregateByMonth(dailyData, dateFrom, dateTo)
  }

  return dailyData.map(d => ({ ...d, label: d.dateLabel || d.date }))
}

/**
 * Aggregates data by week
 */
function aggregateByWeek(
  dailyData: DailyDataPoint[],
  dateFrom: Date,
  dateTo: Date
): AggregatedDataPoint[] {
  const weeks = eachWeekOfInterval(
    { start: dateFrom, end: dateTo },
    { weekStartsOn: 1 } // Monday
  )

  return weeks.map((weekStart, index) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    // Filter data points that fall within this week
    const weekData = dailyData.filter(d => {
      const pointDate = parseISO(d.date)
      return isWithinInterval(pointDate, { start: weekStart, end: weekEnd })
    })

    // Aggregate all numeric fields
    const aggregated: AggregatedDataPoint = {
      date: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`, // For tooltip
      label: `W${index + 1}`, // For X-axis
    }

    if (weekData.length === 0) {
      // Initialize all numeric fields to 0
      if (dailyData.length > 0) {
        const numericKeys = Object.keys(dailyData[0]).filter(
          key => key !== 'date' && key !== 'dateLabel' && typeof dailyData[0][key] === 'number'
        )
        numericKeys.forEach(key => {
          aggregated[key] = 0
        })
      }
      return aggregated
    }

    // Get all numeric keys from first data point
    const numericKeys = Object.keys(weekData[0]).filter(
      key => key !== 'date' && key !== 'dateLabel' && typeof weekData[0][key] === 'number'
    )

    // Sum all numeric fields
    numericKeys.forEach(key => {
      aggregated[key] = weekData.reduce((sum, d) => sum + (d[key] as number), 0)
    })

    return aggregated
  })
}

/**
 * Aggregates data by month
 */
function aggregateByMonth(
  dailyData: DailyDataPoint[],
  dateFrom: Date,
  dateTo: Date
): AggregatedDataPoint[] {
  const months = eachMonthOfInterval({ start: dateFrom, end: dateTo })

  return months.map(monthStart => {
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    monthEnd.setDate(0) // Last day of month

    // Filter data points that fall within this month
    const monthData = dailyData.filter(d => {
      const pointDate = parseISO(d.date)
      return isWithinInterval(pointDate, { start: monthStart, end: monthEnd })
    })

    // Aggregate all numeric fields
    const aggregated: AggregatedDataPoint = {
      date: `${format(monthStart, 'MMM d')} - ${format(monthEnd, 'MMM d')}`, // For tooltip
      label: format(monthStart, 'MMM'), // For X-axis
    }

    if (monthData.length === 0) {
      // Initialize all numeric fields to 0
      if (dailyData.length > 0) {
        const numericKeys = Object.keys(dailyData[0]).filter(
          key => key !== 'date' && key !== 'dateLabel' && typeof dailyData[0][key] === 'number'
        )
        numericKeys.forEach(key => {
          aggregated[key] = 0
        })
      }
      return aggregated
    }

    // Get all numeric keys from first data point
    const numericKeys = Object.keys(monthData[0]).filter(
      key => key !== 'date' && key !== 'dateLabel' && typeof monthData[0][key] === 'number'
    )

    // Sum all numeric fields
    numericKeys.forEach(key => {
      aggregated[key] = monthData.reduce((sum, d) => sum + (d[key] as number), 0)
    })

    return aggregated
  })
}

/**
 * Formats X-axis labels based on grouping
 */
export function formatXAxisLabel(value: string, groupBy: GroupBy): string {
  if (groupBy === 'day') {
    return value // Already formatted as "Jan 15"
  }
  if (groupBy === 'week') {
    return value // Already formatted as "W1 Jan"
  }
  if (groupBy === 'month') {
    return value // Already formatted as "January"
  }
  return value
}
