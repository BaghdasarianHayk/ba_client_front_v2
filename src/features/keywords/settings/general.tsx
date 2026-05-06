import { useEffect, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { Building2, Globe, Loader2, Plus, Swords, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContentSection } from '@/features/settings/components/content-section'
import { PlatformIcon, type PlatformId } from '@/components/platform-icon'
import { useProjectStore } from '@/stores/project-store'
import { KeywordService, type Keyword } from '@/services/api/keyword-service'

const ALL_PLATFORMS: { id: PlatformId; label: string }[] = [
  { id: 'reddit', label: 'Reddit' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'x', label: 'X' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'web', label: 'Web' },
]

const KEYWORD_TYPES = [
  { value: 'brand' as const, label: 'Brand', icon: Building2, color: 'text-emerald-600' },
  { value: 'competitor' as const, label: 'Competitor', icon: Swords, color: 'text-orange-600' },
  { value: 'general' as const, label: 'General', icon: Globe, color: 'text-blue-600' },
]

export function KeywordGeneral() {
  const navigate = useNavigate()
  const { keywordId } = useParams({ strict: false }) as { keywordId?: string }
  const { keyword: initialKeyword } = useSearch({ strict: false }) as { keyword?: string }
  const { currentProject } = useProjectStore()
  const isNew = !keywordId || keywordId === 'new'

  const [kw, setKw] = useState(initialKeyword ?? '')
  const [excluded, setExcluded] = useState<string[]>([])
  const [excludeInput, setExcludeInput] = useState('')
  const [platforms, setPlatforms] = useState<Set<PlatformId>>(new Set(ALL_PLATFORMS.map((p) => p.id)))
  const [kwType, setKwType] = useState<'brand' | 'competitor' | 'general'>('general')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(isNew)

  // Load keyword for edit
  useEffect(() => {
    if (isNew || !currentProject) return
    KeywordService.getKeywords(currentProject.id).then((keywords) => {
      const found = keywords.find((k) => k.id === keywordId)
      if (found) {
        setKw(found.keyword)
        setExcluded(found.excludedKeywords)
        setPlatforms(new Set(found.platforms))
        setKwType(found.keywordType)
      }
      setLoaded(true)
    })
  }, [isNew, keywordId, currentProject])

  const addExcluded = () => {
    const t = excludeInput.trim().toLowerCase()
    if (t && !excluded.includes(t)) {
      setExcluded((p) => [...p, t])
      setExcludeInput('')
    }
  }

  const togglePlatform = (id: PlatformId) => {
    setPlatforms((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!kw.trim() || platforms.size === 0 || !currentProject) return
    setSaving(true)
    try {
      const req = {
        keyword: kw.trim(),
        excluded_keywords: excluded,
        is_active: true,
        show_mention_threshold: 50,
        autoreply_mention_threshold: 101,
        autoreply_mention_score_threshold: 0,
        autoreact_mention_threshold: 101,
        autoreact_sentiments: {},
        comment_count_min: null as number | null,
        comment_count_max: null as number | null,
        keyword_type: kwType,
        platform_reddit: platforms.has('reddit'),
        platform_telegram: platforms.has('telegram'),
        platform_twitter: platforms.has('x'),
        platform_youtube: platforms.has('youtube'),
        platform_instagram: platforms.has('instagram'),
        platform_facebook: platforms.has('facebook'),
        platform_tiktok: platforms.has('tiktok'),
        platform_web: platforms.has('web'),
      }

      if (isNew) {
        const created = await KeywordService.createKeyword(currentProject.id, req)
        toast.success('Keyword created')
        navigate({ to: `/keywords/${created.id}`, replace: true })
      } else {
        await KeywordService.updateKeyword(keywordId!, req)
        toast.success('Keyword updated')
      }
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <ContentSection
      title='General'
      desc='Keyword text, excluded terms, platforms, and type.'
    >
      <div className='space-y-5'>
        {/* Keyword */}
        <div className='space-y-1.5'>
          <Label className='text-xs'>Keyword</Label>
          <Input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder='e.g. crypto wallet'
            autoFocus={isNew}
          />
        </div>

        {/* Excluded */}
        <div className='space-y-1.5'>
          <Label className='text-xs'>
            Excluded terms{' '}
            <span className='font-normal text-muted-foreground'>(optional)</span>
          </Label>
          <div className='flex gap-1.5'>
            <Input
              value={excludeInput}
              onChange={(e) => setExcludeInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') { e.preventDefault(); addExcluded() }
              }}
              placeholder='Type and press Enter'
              className='flex-1'
            />
            <Button variant='outline' size='icon' onClick={addExcluded} disabled={!excludeInput.trim()}>
              <Plus className='size-4' />
            </Button>
          </div>
          {excluded.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {excluded.map((t) => (
                <Badge key={t} variant='secondary' className='gap-1 pr-1'>
                  {t}
                  <button type='button' onClick={() => setExcluded((p) => p.filter((x) => x !== t))} className='rounded-sm p-0.5 hover:bg-muted-foreground/20'>
                    <X className='size-3' />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Platforms */}
        <div className='space-y-1.5'>
          <Label className='text-xs'>Platforms</Label>
          <div className='grid grid-cols-4 gap-1.5'>
            {ALL_PLATFORMS.map((p) => (
              <label
                key={p.id}
                className='flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5'
              >
                <Checkbox checked={platforms.has(p.id)} onCheckedChange={() => togglePlatform(p.id)} className='size-3.5' />
                <PlatformIcon platform={p.id} size='sm' />
                <span className='hidden sm:inline'>{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Keyword type */}
        <div className='space-y-1.5'>
          <Label className='text-xs'>Type</Label>
          <div className='flex gap-2'>
            {KEYWORD_TYPES.map(({ value, label, icon: Icon, color }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors ${kwType === value ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
              >
                <input type='radio' name='kwType' value={value} checked={kwType === value} onChange={() => setKwType(value)} className='sr-only' />
                <Icon className={`size-4 ${color}`} />
                {label}
              </label>
            ))}
          </div>
          <p className='text-[11px] text-muted-foreground'>
            Determines which knowledge base and reply strategy the AI uses.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving || !kw.trim() || platforms.size === 0}>
          {saving && <Loader2 className='animate-spin' />}
          {isNew ? 'Create Keyword' : 'Save Changes'}
        </Button>
      </div>
    </ContentSection>
  )
}
