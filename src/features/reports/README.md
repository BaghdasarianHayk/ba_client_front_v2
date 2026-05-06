# Reports Feature - Data Grouping

## Overview

The reports page supports dynamic data grouping by **Day**, **Week**, or **Month** based on the selected date range.

## Architecture

### 1. Smart Grouping Logic (`data-aggregation.ts`)

The system automatically determines the best grouping based on date range:

- **1-7 days**: Only "Day" available
- **8-60 days**: "Day" and "Week" available (default: Day)
- **61-365 days**: "Day", "Week", and "Month" available (default: Week)
- **365+ days**: "Week" and "Month" available (default: Month)

### 2. Data Aggregation

All numeric fields are **summed** when grouping:
- Mentions count → SUM
- Reach score → SUM
- Comments/Reactions → SUM

This is correct for cumulative metrics. For future average metrics (like avg response time), the aggregation logic should be extended.

### 3. UI Components

**Toggle Group in Header:**
- Shows only available grouping options based on date range
- Automatically switches to recommended grouping when date range changes
- Persists user selection when possible

**Date Formatting:**
- Day: "Jan 15"
- Week: "W1 Jan" (week number + month)
- Month: "January" or "Jan 2024"

## Data Flow

```
User selects date range
    ↓
System calculates available groupings
    ↓
User selects grouping (or uses recommended)
    ↓
useMemo aggregates data based on grouping
    ↓
Charts render with aggregated data
```

## Backend Integration (Future)

When connecting to real API:

1. **API Request:**
```typescript
GET /api/reports/mentions?
  from=2024-01-01&
  to=2024-01-31&
  groupBy=week  // 'day' | 'week' | 'month'
```

2. **Backend Responsibility:**
   - Backend should handle aggregation (more efficient)
   - Return pre-aggregated data based on `groupBy` parameter
   - Frontend aggregation is only for mock data

3. **Response Format:**
```typescript
{
  data: [
    { date: "2024-01-01", telegram: 120, reddit: 45, ... },
    { date: "2024-01-08", telegram: 98, reddit: 52, ... }
  ],
  groupBy: "week"
}
```

## Files

- `index.tsx` - Main reports page with charts
- `data-aggregation.ts` - Aggregation logic and helpers
- `mock-data.ts` - Mock data (daily granularity)

## Future Improvements

1. **Average Metrics**: Add support for averaging (not summing) certain fields
2. **Custom Date Ranges**: Allow users to define custom grouping periods
3. **Caching**: Cache aggregated data to avoid recalculation
4. **Export**: Include grouping info in exported reports
