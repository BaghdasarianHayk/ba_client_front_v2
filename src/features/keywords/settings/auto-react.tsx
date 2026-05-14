import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import {
  Angry,
  ArrowRight,
  Loader2,
  Meh,
  MessageCircleQuestion,
  Smile,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { InfoTooltip } from '@/components/info-tooltip'
import { ContentSection } from '@/features/settings/components/content-section'
import { useProjectStore } from '@/stores/project-store'
import { KeywordService } from '@/services/api/keyword-service'

type SentimentId = 'positive' | 'negative' | 'neutral' | 'question'
type ReactionType = 'POSITIVE' | 'NEGATIVE' | null

const SENTIMENTS: {
  id: SentimentId
  label: string
  icon: React.ElementType
  color: string
}[] = [
  { id: 'positive', label: 'Positive', icon: Smile, color: 'text-green-600 dark:text-green-400' },
  { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-amber-600 dark:text-amber-400' },
  { id: 'negative', label: 'Negative', icon: Angry, color: 'text-red-600 dark:text-red-400' },
  { id: 'question', label: 'Question', icon: MessageCircleQuestion, color: 'text-purple-600 dark:text-purple-400' },
]

export function KeywordAutoReact() {
  const { keywordId } = useParams({ strict: false }) as { keywordId?: string }
  const { currentProject } = useProjectStore()
  const isNew = !keywordId || keywordId === 'new'

  const [enabled, setEnabled] = useState(false)
  const [threshold, setThreshold] = useState(70)
  const [reactions, setReactions] = useState<Record<SentimentId, ReactionType>>({
    positive: null,
    negative: null,
    neutral: null,
    question: null,
  })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(isNew)

  useEffect(() => {
    if (isNew || !currentProject) return
    KeywordService.getKeywords(currentProject.id).then((keywords) => {
      const found = keywords.find((k) => k.id === keywordId)
      if (found) {
        setEnabled(found.autoReact.enabled)
        setThreshold(found.autoReact.threshold)
        setReactions({ ...found.autoReact.sentiments })
      }
      setLoaded(true)
    })
  }, [isNew, keywordId, currentProject])

  const toggle = (id: SentimentId, type: ReactionType) => {
    setReactions((prev) => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }))
  }

  const handleSave = async () => {
    if (!keywordId || isNew) return
    setSaving(true)
    try {
      const sentiments: Record<string, string[]> = {}
      for (const [k, v] of Object.entries(reactions)) {
        if (v) sentiments[k.toUpperCase()] = [v]
      }
      await KeywordService.updateKeyword(keywordId, {
        autoreact_mention_threshold: enabled ? threshold : 101,
        autoreact_sentiments: sentiments,
      } as any)
      toast.success('Auto react settings saved')
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <ContentSection
      title='Auto React'
      desc='Automatically react to mentions based on comment sentiment.'
    >
      <div className='space-y-5'>
        {/* Enable */}
        <div className='flex items-center justify-between'>
          <div>
            <Label className='text-sm'>Enable auto react</Label>
            <p className='text-[11px] text-muted-foreground'>
              AI will set reactions on comments based on their sentiment.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className={enabled ? '' : 'pointer-events-none opacity-40'}>
          {/* Min relevance */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <Label className='text-xs'>Min. relevance</Label>
                <InfoTooltip content='Only react to comments with relevance above this threshold. Higher values mean fewer but more targeted reactions.' />
              </div>
              <span className='text-sm font-medium'>{threshold}%</span>
            </div>
            <Slider value={[threshold]} onValueChange={([v]) => setThreshold(v)} min={0} max={100} step={1} />
          </div>

          {/* Sentiment → Reaction mapping */}
          <div className='mt-4 space-y-2'>
            <div className='flex items-center gap-1.5'>
              <Label className='text-xs'>Reaction per sentiment</Label>
              <InfoTooltip content='Map each comment sentiment to a reaction. For example: set 👍 for positive comments and 👎 for negative ones. Leave empty to skip reacting to that sentiment.' />
            </div>
            <p className='text-[11px] text-muted-foreground'>
              Choose which reaction to set for each comment sentiment.
            </p>
            <div className='mt-2 space-y-1.5'>
              {SENTIMENTS.map(({ id, label, icon: SIcon, color }) => {
                const current = reactions[id]
                return (
                  <div
                    key={id}
                    className='flex items-center gap-2 rounded-md border px-2.5 py-1.5'
                  >
                    <SIcon className={cn('size-4', color)} />
                    <span className='flex-1 text-xs'>{label}</span>
                    <ArrowRight className='size-3 text-muted-foreground' />
                    <button
                      type='button'
                      onClick={() => toggle(id, 'POSITIVE')}
                      className={cn(
                        'rounded-md border p-1 transition-colors',
                        current === 'POSITIVE'
                          ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'text-muted-foreground hover:text-green-600'
                      )}
                    >
                      <ThumbsUp className='size-3.5' />
                    </button>
                    <button
                      type='button'
                      onClick={() => toggle(id, 'NEGATIVE')}
                      className={cn(
                        'rounded-md border p-1 transition-colors',
                        current === 'NEGATIVE'
                          ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'text-muted-foreground hover:text-red-600'
                      )}
                    >
                      <ThumbsDown className='size-3.5' />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {!isNew && (
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className='animate-spin' />}
            Save Changes
          </Button>
        )}
      </div>
    </ContentSection>
  )
}
