import { useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { MentionFilters } from '@/services/api/mention-service'

/**
 * Bidirectional sync between MentionFilters and URL search params.
 * Uses TanStack Router's typed search params.
 */
export function useMentionFilters() {
  const navigate = useNavigate()
  const raw = useSearch({ strict: false }) as Record<string, unknown>

  const filters = useMemo<MentionFilters>(() => {
    const f: MentionFilters = {}
    const s = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : undefined)
    const n = (k: string) => {
      const v = raw[k]
      if (typeof v === 'number') return v
      if (typeof v === 'string') { const p = Number(v); return Number.isFinite(p) ? p : undefined }
      return undefined
    }
    const b = (k: string) => {
      const v = raw[k]
      if (typeof v === 'boolean') return v
      if (v === 'true') return true
      if (v === 'false') return false
      return undefined
    }

    if (n('page')) f.page = n('page')
    if (n('per_page')) f.per_page = n('per_page')
    if (s('search')) f.search = s('search')
    if (s('sentiment')) f.sentiment = s('sentiment')
    if (s('platform')) f.platform = s('platform')
    if (s('order_by')) f.order_by = s('order_by') as MentionFilters['order_by']
    if (s('order_direction')) f.order_direction = s('order_direction') as MentionFilters['order_direction']
    if (s('posted_at_from')) f.posted_at_from = s('posted_at_from')
    if (s('posted_at_to')) f.posted_at_to = s('posted_at_to')
    if (s('replied')) f.replied = s('replied')
    if (n('unified_score_from') !== undefined) f.unified_score_from = n('unified_score_from')
    if (n('unified_score_to') !== undefined) f.unified_score_to = n('unified_score_to')
    if (n('relevance_from') !== undefined) f.relevance_from = n('relevance_from')
    if (n('relevance_to') !== undefined) f.relevance_to = n('relevance_to')
    if (s('keywords')) f.keywords = s('keywords')
    if (b('has_comments') !== undefined) f.has_comments = b('has_comments')
    if (b('is_commentable') !== undefined) f.is_commentable = b('is_commentable')

    return f
  }, [raw])

  const setFilters = useCallback(
    (next: MentionFilters) => {
      const search: Record<string, string | number | boolean> = {}
      if (next.page) search.page = next.page
      if (next.per_page) search.per_page = next.per_page
      if (next.search) search.search = next.search
      if (next.sentiment) search.sentiment = next.sentiment
      if (next.platform) search.platform = next.platform
      if (next.order_by) search.order_by = next.order_by
      if (next.order_direction) search.order_direction = next.order_direction
      if (next.posted_at_from) search.posted_at_from = next.posted_at_from
      if (next.posted_at_to) search.posted_at_to = next.posted_at_to
      if (next.replied) search.replied = next.replied
      if (next.unified_score_from !== undefined) search.unified_score_from = next.unified_score_from
      if (next.unified_score_to !== undefined) search.unified_score_to = next.unified_score_to
      if (next.relevance_from !== undefined) search.relevance_from = next.relevance_from
      if (next.relevance_to !== undefined) search.relevance_to = next.relevance_to
      if (next.keywords) search.keywords = next.keywords
      if (next.has_comments !== undefined) search.has_comments = next.has_comments
      if (next.is_commentable !== undefined) search.is_commentable = next.is_commentable

      navigate({ search, replace: true } as any)
    },
    [navigate]
  )

  const updateFilter = useCallback(
    (partial: Partial<MentionFilters>) => {
      const merged = { ...filters, ...partial }
      // Remove undefined values
      for (const k of Object.keys(merged) as (keyof MentionFilters)[]) {
        if (merged[k] === undefined) delete merged[k]
      }
      setFilters(merged)
    },
    [filters, setFilters]
  )

  return { filters, setFilters, updateFilter }
}
