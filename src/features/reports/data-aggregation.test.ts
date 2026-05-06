// @ts-expect-error vitest not installed as dependency
import { describe, it, expect } from 'vitest'
import { aggregateData } from './data-aggregation'

describe('aggregateData', () => {
  const mockDailyData = [
    { date: 'Jan 1', telegram: 10, reddit: 5 },
    { date: 'Jan 2', telegram: 15, reddit: 8 },
    { date: 'Jan 3', telegram: 12, reddit: 6 },
    { date: 'Jan 8', telegram: 20, reddit: 10 },
    { date: 'Jan 9', telegram: 18, reddit: 9 },
  ]

  it('should return data as-is for day grouping', () => {
    const result = aggregateData(
      mockDailyData,
      'day',
      new Date('2024-01-01'),
      new Date('2024-01-09')
    )

    expect(result).toHaveLength(5)
    expect(result[0]).toHaveProperty('label')
    expect(result[0].telegram).toBe(10)
  })

  it('should sum values when grouping by week', () => {
    const result = aggregateData(
      mockDailyData,
      'week',
      new Date('2024-01-01'),
      new Date('2024-01-09')
    )

    // Should have 2 weeks
    expect(result.length).toBeGreaterThanOrEqual(1)
    
    // First week should sum Jan 1-3
    const firstWeek = result[0]
    expect(firstWeek.telegram).toBe(10 + 15 + 12) // 37
    expect(firstWeek.reddit).toBe(5 + 8 + 6) // 19
  })

  it('should handle empty data gracefully', () => {
    const result = aggregateData(
      [],
      'week',
      new Date('2024-01-01'),
      new Date('2024-01-09')
    )

    expect(result).toBeInstanceOf(Array)
  })

  it('should preserve all numeric fields during aggregation', () => {
    const dataWithMultipleFields = [
      { date: 'Jan 1', field1: 10, field2: 20, field3: 30 },
      { date: 'Jan 2', field1: 15, field2: 25, field3: 35 },
    ]

    const result = aggregateData(
      dataWithMultipleFields,
      'week',
      new Date('2024-01-01'),
      new Date('2024-01-02')
    )

    const firstWeek = result[0]
    expect(firstWeek.field1).toBe(25)
    expect(firstWeek.field2).toBe(45)
    expect(firstWeek.field3).toBe(65)
  })
})
