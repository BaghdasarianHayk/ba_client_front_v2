import { useEffect, useState, type KeyboardEvent } from 'react'
import {
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PlatformIcon, type PlatformId } from '@/components/platform-icon'
import {
  KeywordService,
  type Keyword,
} from '@/services/api/keyword-service'

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

type SentimentId = 'positive' | 'negative' | 'neutral' | 'question'
type ReactionType = 'POSITIVE' | 'NEGATIVE' | null

const SENTIMENTS: { id: SentimentId; label: string }[] = [
  { id: 'positive', label: 'Positive' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'negative', label: 'Negative' },
  { id: 'question', label: 'Question' },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyword: Keyword | null
  initialKeyword: string
  projectId: string
  onSuccess: () => void
}

export function KeywordSheet({
  open,
  onOpenChange,
  keyword: editKw,
  initialKeyword,
  projectId,
  onSuccess,
}: Props) {
  const isEdit = !!editKw

  // Form state
  const [kw, setKw] = useState('')
  const [excluded, setExcluded] = useState<string[]>([])
  const [excludeInput, setExcludeInput] = useState('')
  const [platforms, setPlatforms] = useState<Set<PlatformId>>(
    new Set(['reddit', 'x'])
  )
  const [threshold, setThreshold] = useState(80)
  const [filterPrompt, setFilterPrompt] = useState('')

  // Auto comment
  const [autoCommentOn, setAutoCommentOn] = useState(false)
  const [acThreshold, setAcThreshold] = useState(85)
  const [acScore, setAcScore] = useState(0)
  const [acMin, setAcMin] = useState(0)
  const [acMax, setAcMax] = useState(10)
  const [acRules, setAcRules] = useState('')

  // Auto react
  const [autoReactOn, setAutoReactOn] = useState(false)
  const [arThreshold, setArThreshold] = useState(70)
  const [arSentiments, setArSentiments] = useState<
    Record<SentimentId, ReactionType>
  >({ positive: null, negative: null, neutral: null, question: null })

  const [saving, setSaving] = useState(false)

  // Reset form when opening
  useEffect(() => {
    if (!open) return
    if (editKw) {
      setKw(editKw.keyword)
      setExcluded(editKw.excludedKeywords)
      setPlatforms(new Set(editKw.platforms))
      setThreshold(editKw.showThreshold)
      setFilterPrompt(editKw.filteringPrompt)
      setAutoCommentOn(editKw.autoComment.enabled)
      setAcThreshold(editKw.autoComment.threshold)
      setAcScore(editKw.autoComment.scoreThreshold)
      setAcMin(editKw.autoComment.countMin)
      setAcMax(editKw.autoComment.countMax)
      setAcRules(editKw.autoComment.rules)
      setAutoReactOn(editKw.autoReact.enabled)
      setArThreshold(editKw.autoReact.threshold)
      setArSentiments({ ...editKw.autoReact.sentiments })
    } else {
      setKw(initialKeyword)
      setExcluded([])
      setPlatforms(new Set(['reddit', 'x']))
      setThreshold(80)
      setFilterPrompt('')
      setAutoCommentOn(false)
      setAcThreshold(85)
      setAcScore(0)
      setAcMin(0)
      setAcMax(10)
      setAcRules('')
      setAutoReactOn(false)
      setArThreshold(70)
      setArSentiments({
        positive: null,
        negative: null,
        neutral: null,
        question: null,
      })
    }
  }, [open, editKw, initialKeyword])

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

  const buildRequest = () => ({
    keyword: kw.trim(),
    excluded_keywords: excluded,
    is_active: editKw?.isActive ?? true,
    additional_hint_search: filterPrompt || undefined,
    additional_hint_reply: acRules || undefined,
    comment_count_min: acMin,
    comment_count_max: acMax,
    show_mention_threshold: threshold,
    autoreply_mention_threshold: autoCommentOn ? acThreshold : 101,
    autoreply_mention_score_threshold: acScore,
    autoreact_mention_threshold: autoReactOn ? arThreshold : 101,
    autoreact_sentiments: Object.fromEntries(
      Object.entries(arSentiments)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => [k.toUpperCase(), [v]])
    ),
    platform_reddit: platforms.has('reddit'),
    platform_telegram: platforms.has('telegram'),
    platform_twitter: platforms.has('x'),
    platform_youtube: platforms.has('youtube'),
    platform_instagram: platforms.has('instagram'),
    platform_facebook: platforms.has('facebook'),
    platform_tiktok: platforms.has('tiktok'),
    platform_web: platforms.has('web'),
  })

  const handleSave = async () => {
    if (!kw.trim() || platforms.size === 0) return
    setSaving(true)
    try {
      if (isEdit) {
        await KeywordService.updateKeyword(editKw!.id, buildRequest() as any)
        toast.success('Keyword updated')
      } else {
        await KeywordService.createKeyword(projectId, buildRequest() as any)
        toast.success('Keyword created')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col overflow-y-auto sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Keyword' : 'Add Keyword'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update keyword settings and monitoring rules.'
              : 'Configure a new keyword to monitor across platforms.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-5 py-4'>
          {/* ── General ─────────────────────────────────────────────────── */}
          <div className='space-y-3'>
            <div>
              <Label className='text-xs'>Keyword</Label>
              <Input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                placeholder='e.g. crypto wallet'
                className='mt-1'
                autoFocus
              />
            </div>

            <div>
              <Label className='text-xs'>
                Excluded{' '}
                <span className='font-normal text-muted-foreground'>
                  (optional)
                </span>
              </Label>
              <div className='mt-1 flex gap-1.5'>
                <Input
                  value={excludeInput}
                  onChange={(e) => setExcludeInput(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addExcluded()
                    }
                  }}
                  placeholder='Add excluded term'
                  className='flex-1'
                />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={addExcluded}
                  disabled={!excludeInput.trim()}
                >
                  <Plus className='size-4' />
                </Button>
              </div>
              {excluded.length > 0 && (
                <div className='mt-1.5 flex flex-wrap gap-1'>
                  {excluded.map((t) => (
                    <Badge key={t} variant='secondary' className='gap-1 pr-1'>
                      {t}
                      <button
                        type='button'
                        onClick={() =>
                          setExcluded((p) => p.filter((x) => x !== t))
                        }
                        className='rounded-sm p-0.5 hover:bg-muted-foreground/20'
                      >
                        <X className='size-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className='mb-1.5 block text-xs'>Platforms</Label>
              <div className='grid grid-cols-4 gap-1.5'>
                {ALL_PLATFORMS.map((p) => (
                  <label
                    key={p.id}
                    className='flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5'
                  >
                    <Checkbox
                      checked={platforms.has(p.id)}
                      onCheckedChange={() => togglePlatform(p.id)}
                      className='size-3.5'
                    />
                    <PlatformIcon platform={p.id} size='sm' />
                    <span className='hidden sm:inline'>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Monitoring ──────────────────────────────────────────────── */}
          <div className='space-y-2'>
            <p className='text-xs font-medium'>Monitoring</p>
            <div className='flex items-center gap-2'>
              <Label className='flex-1 text-xs text-muted-foreground'>
                Min. relevance to show mention
              </Label>
              <Input
                type='number'
                min={0}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(+e.target.value)}
                className='h-7 w-16 text-xs'
              />
              <span className='text-xs text-muted-foreground'>%</span>
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>
                Filtering prompt{' '}
                <span className='font-normal'>(optional)</span>
              </Label>
              <Textarea
                value={filterPrompt}
                onChange={(e) => setFilterPrompt(e.target.value)}
                placeholder='Additional AI instructions for filtering…'
                className='mt-1 min-h-[56px] resize-y text-xs'
              />
            </div>
          </div>

          <Separator />

          {/* ── Auto Comment ────────────────────────────────────────────── */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-medium'>Auto Comment</p>
              <Switch
                checked={autoCommentOn}
                onCheckedChange={setAutoCommentOn}
                className='scale-90'
              />
            </div>
            {autoCommentOn && (
              <div className='space-y-2 pl-0.5'>
                <div className='flex items-center gap-2'>
                  <Label className='flex-1 text-xs text-muted-foreground'>
                    Min. relevance
                  </Label>
                  <Input
                    type='number'
                    min={0}
                    max={100}
                    value={acThreshold}
                    onChange={(e) => setAcThreshold(+e.target.value)}
                    className='h-7 w-16 text-xs'
                  />
                  <span className='text-xs text-muted-foreground'>%</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Label className='flex-1 text-xs text-muted-foreground'>
                    Min. reach score
                  </Label>
                  <Input
                    type='number'
                    min={0}
                    value={acScore}
                    onChange={(e) => setAcScore(+e.target.value)}
                    className='h-7 w-16 text-xs'
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <Label className='flex-1 text-xs text-muted-foreground'>
                    Comment count
                  </Label>
                  <Input
                    type='number'
                    min={0}
                    value={acMin}
                    onChange={(e) => setAcMin(+e.target.value)}
                    className='h-7 w-14 text-xs'
                  />
                  <span className='text-xs text-muted-foreground'>–</span>
                  <Input
                    type='number'
                    min={0}
                    value={acMax}
                    onChange={(e) => setAcMax(+e.target.value)}
                    className='h-7 w-14 text-xs'
                  />
                </div>
                <div>
                  <Label className='text-xs text-muted-foreground'>
                    Reply rules{' '}
                    <span className='font-normal'>(optional)</span>
                  </Label>
                  <Textarea
                    value={acRules}
                    onChange={(e) => setAcRules(e.target.value)}
                    placeholder='Instructions for AI when writing replies…'
                    className='mt-1 min-h-[56px] resize-y text-xs'
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Auto React ──────────────────────────────────────────────── */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-medium'>Auto React</p>
              <Switch
                checked={autoReactOn}
                onCheckedChange={setAutoReactOn}
                className='scale-90'
              />
            </div>
            {autoReactOn && (
              <div className='space-y-2 pl-0.5'>
                <div className='flex items-center gap-2'>
                  <Label className='flex-1 text-xs text-muted-foreground'>
                    Min. relevance
                  </Label>
                  <Input
                    type='number'
                    min={0}
                    max={100}
                    value={arThreshold}
                    onChange={(e) => setArThreshold(+e.target.value)}
                    className='h-7 w-16 text-xs'
                  />
                  <span className='text-xs text-muted-foreground'>%</span>
                </div>
                <div className='space-y-1'>
                  {SENTIMENTS.map((s) => (
                    <div
                      key={s.id}
                      className='flex items-center gap-2'
                    >
                      <span className='w-16 text-xs text-muted-foreground'>
                        {s.label}
                      </span>
                      <Select
                        value={arSentiments[s.id] ?? 'none'}
                        onValueChange={(v) =>
                          setArSentiments((prev) => ({
                            ...prev,
                            [s.id]: v === 'none' ? null : v,
                          }))
                        }
                      >
                        <SelectTrigger className='h-7 w-28 text-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='none'>None</SelectItem>
                          <SelectItem value='POSITIVE'>👍 Positive</SelectItem>
                          <SelectItem value='NEGATIVE'>👎 Negative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter>
          <Button
            onClick={handleSave}
            disabled={saving || !kw.trim() || platforms.size === 0}
            className='w-full'
          >
            {saving && <Loader2 className='animate-spin' />}
            {isEdit ? 'Save Changes' : 'Create Keyword'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
