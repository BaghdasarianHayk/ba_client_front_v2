import { Fragment, useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Loader2,
  Plus,
  RefreshCw,
  Search as SearchIcon,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useProjectStore } from '@/stores/project-store'
import {
  KeywordService,
  type Keyword,
} from '@/services/api/keyword-service'
import { MentionService, type MentionStats } from '@/services/api/mention-service'
import type { KeywordSuggestions } from '@/services/api/types'
import { KeywordsTable } from './components/keywords-table'
import { KeywordDeleteDialog } from './components/keyword-delete-dialog'
import { useViewerMode } from '@/hooks/use-viewer-mode'

// ─── AI Suggestions ──────────────────────────────────────────────────────────

function SuggestionChip({
  text,
  onClick,
}: {
  text: string
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='cursor-pointer rounded-md bg-muted px-2 py-0.5 text-xs transition-colors hover:bg-primary hover:text-primary-foreground'
    >
      + {text}
    </button>
  )
}

function SuggestionGroup({
  title,
  items,
  onSelect,
}: {
  title: string
  items: string[]
  onSelect: (kw: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div>
      <p className='mb-1 text-[11px] font-medium text-muted-foreground'>
        {title}
      </p>
      <div className='flex flex-wrap gap-1'>
        {items.map((item, i) => (
          <SuggestionChip key={i} text={item} onClick={() => onSelect(item)} />
        ))}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function KeywordsPage() {
  const navigate = useNavigate()
  const { currentProject } = useProjectStore()
  const { canEdit } = useViewerMode()
  const projectId = currentProject?.id

  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Suggestions (cached in localStorage per project)
  const suggestionsKey = projectId ? `ba_suggestions_${projectId}` : null
  const [suggestions, setSuggestions] = useState<KeywordSuggestions | null>(() => {
    if (!suggestionsKey) return null
    try {
      const cached = localStorage.getItem(suggestionsKey)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load cached suggestions when project changes
  useEffect(() => {
    if (!suggestionsKey) return
    try {
      const cached = localStorage.getItem(suggestionsKey)
      if (cached) {
        setSuggestions(JSON.parse(cached))
        setSuggestionsOpen(true)
      } else {
        setSuggestions(null)
      }
    } catch {
      setSuggestions(null)
    }
  }, [suggestionsKey])

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Keyword | null>(null)

  const fetchKeywords = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      // Fetch stats first to get mention counts per keyword
      let counts: Map<string, number> | undefined
      try {
        const stats = await MentionService.getStats(projectId)
        counts = new Map<string, number>()
        for (const kw of [...stats.active_keywords, ...stats.inactive_keywords, ...stats.deleted_keywords]) {
          counts.set(kw.id, kw.count)
        }
      } catch {
        // Stats are non-critical
      }
      setKeywords(await KeywordService.getKeywords(projectId, counts))
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to load keywords')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchKeywords()
  }, [fetchKeywords])

  const handleRefreshSuggestions = async () => {
    if (!projectId || !suggestionsKey) return
    setRefreshing(true)
    try {
      const data = await KeywordService.getSuggestions(projectId)
      setSuggestions(data)
      localStorage.setItem(suggestionsKey, JSON.stringify(data))
      if (!suggestionsOpen) setSuggestionsOpen(true)
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to load suggestions')
    } finally {
      setRefreshing(false)
    }
  }

  const handleAdd = () => {
    navigate({ to: '/keywords/new' })
  }

  const handleAddFromSuggestion = (kw: string) => {
    navigate({ to: '/keywords/new', search: { keyword: kw } })
  }

  const handleEdit = (kw: Keyword) => {
    navigate({ to: `/keywords/${kw.id}` })
  }

  const handleToggleActive = async (kw: Keyword) => {
    try {
      if (kw.isActive) {
        await KeywordService.deactivate(kw.id)
      } else {
        await KeywordService.activate(kw.id)
      }
      setKeywords((prev) =>
        prev.map((k) =>
          k.id === kw.id ? { ...k, isActive: !k.isActive } : k
        )
      )
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to toggle')
    }
  }

  const filtered = keywords.filter((k) =>
    k.keyword.toLowerCase().includes(search.toLowerCase())
  )

  const hasSuggestions =
    suggestions &&
    (suggestions.my_brand_suggestions.length > 0 ||
      suggestions.current_products_and_services_suggestions.length > 0 ||
      suggestions.potential_products_and_services_suggestions.length > 0 ||
      suggestions.competitions.length > 0)

  return (
    <>
      <Header fixed>
        <h1 className='text-sm font-semibold whitespace-nowrap'>
          {loading ? (
            <Skeleton className='inline-block h-4 w-20' />
          ) : (
            `${keywords.length} Keywords`
          )}
        </h1>

        <div className='ms-auto flex items-center gap-1.5 sm:gap-2'>
          <div className='relative hidden sm:block'>
            <SearchIcon className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search keywords…'
              className='h-8 w-40 pl-8 lg:w-[220px]'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canEdit && (
            <Button size='sm' className='h-8 gap-1.5' onClick={handleAdd}>
              <Plus className='size-3.5' />
              <span className='hidden sm:inline'>Add Keyword</span>
            </Button>
          )}
          <ThemeSwitch />
          <span className='hidden sm:inline-flex'>
            <ProfileDropdown />
          </span>
        </div>
      </Header>

      <Main>
        {/* AI Suggestions */}
        <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
          <div className='mb-4 rounded-lg border bg-card'>
            <div className='flex items-center justify-between px-3 py-2'>
              <CollapsibleTrigger asChild>
                <button className='flex cursor-pointer items-center gap-2 text-sm font-medium'>
                  <Sparkles className='size-4 text-purple-500' />
                  AI Suggestions
                  {hasSuggestions && (
                    <span className='text-xs text-muted-foreground'>
                      ({[
                        suggestions!.my_brand_suggestions,
                        suggestions!.current_products_and_services_suggestions,
                        suggestions!.potential_products_and_services_suggestions,
                        suggestions!.competitions,
                      ].reduce((a, b) => a + b.length, 0)})
                    </span>
                  )}
                </button>
              </CollapsibleTrigger>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 gap-1.5 text-xs'
                onClick={handleRefreshSuggestions}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <RefreshCw className='size-3.5' />
                )}
                Refresh
              </Button>
            </div>
            <CollapsibleContent>
              {hasSuggestions ? (
                <div className='grid grid-cols-1 gap-3 border-t px-3 py-2.5 sm:grid-cols-2 lg:grid-cols-4'>
                  <SuggestionGroup
                    title='My Brand'
                    items={suggestions!.my_brand_suggestions}
                    onSelect={handleAddFromSuggestion}
                  />
                  <SuggestionGroup
                    title='Current Products'
                    items={
                      suggestions!.current_products_and_services_suggestions
                    }
                    onSelect={handleAddFromSuggestion}
                  />
                  <SuggestionGroup
                    title='Potential Products'
                    items={
                      suggestions!.potential_products_and_services_suggestions
                    }
                    onSelect={handleAddFromSuggestion}
                  />
                  <SuggestionGroup
                    title='Competitions'
                    items={suggestions!.competitions}
                    onSelect={handleAddFromSuggestion}
                  />
                </div>
              ) : (
                <p className='border-t px-3 py-4 text-center text-sm text-muted-foreground'>
                  Click Refresh to get AI-generated keyword suggestions
                </p>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Table */}
        {loading ? (
          <div className='space-y-2'>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className='h-10 w-full' />
            ))}
          </div>
        ) : filtered.length === 0 && keywords.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground'>
            <p className='text-sm'>No keywords yet</p>
            <p className='mt-1 text-xs'>
              Add your first keyword to start monitoring
            </p>
            <Button
              size='sm'
              className='mt-3 gap-1.5'
              onClick={handleAdd}
            >
              <Plus className='size-3.5' />
              Add Keyword
            </Button>
          </div>
        ) : (
          <KeywordsTable
            keywords={filtered}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
            onToggleActive={handleToggleActive}
          />
        )}
      </Main>

      {/* Delete */}
      <KeywordDeleteDialog
        keyword={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={fetchKeywords}
      />
    </>
  )
}
