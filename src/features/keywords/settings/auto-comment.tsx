import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ContentSection } from '@/features/settings/components/content-section'
import { useProjectStore } from '@/stores/project-store'
import { KeywordService } from '@/services/api/keyword-service'

export function KeywordAutoComment() {
  const { keywordId } = useParams({ strict: false }) as { keywordId?: string }
  const { currentProject } = useProjectStore()
  const isNew = !keywordId || keywordId === 'new'

  const [enabled, setEnabled] = useState(false)
  const [threshold, setThreshold] = useState(85)
  const [score, setScore] = useState(0)
  const [countRange, setCountRange] = useState<[number, number]>([0, 10])
  const [rules, setRules] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(isNew)

  useEffect(() => {
    if (isNew || !currentProject) return
    KeywordService.getKeywords(currentProject.id).then((keywords) => {
      const found = keywords.find((k) => k.id === keywordId)
      if (found) {
        setEnabled(found.autoComment.enabled)
        setThreshold(found.autoComment.threshold)
        setScore(found.autoComment.scoreThreshold)
        setCountRange([found.autoComment.countMin, found.autoComment.countMax])
        setRules(found.autoComment.rules)
      }
      setLoaded(true)
    })
  }, [isNew, keywordId, currentProject])

  const handleSave = async () => {
    if (!keywordId || isNew) return
    setSaving(true)
    try {
      await KeywordService.updateKeyword(keywordId, {
        autoreply_mention_threshold: enabled ? threshold : 101,
        autoreply_mention_score_threshold: score,
        comment_count_min: countRange[0],
        comment_count_max: countRange[1],
        additional_hint_reply: rules || undefined,
      } as any)
      toast.success('Auto comment settings saved')
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <ContentSection
      title='Auto Comment'
      desc='Automatically reply to mentions that match your criteria.'
    >
      <div className='space-y-5'>
        {/* Enable */}
        <div className='flex items-center justify-between'>
          <div>
            <Label className='text-sm'>Enable auto comment</Label>
            <p className='text-[11px] text-muted-foreground'>
              AI will automatically post replies to matching mentions.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className={enabled ? '' : 'pointer-events-none opacity-40'}>
          {/* Min relevance */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs'>Min. relevance</Label>
              <span className='text-sm font-medium'>{threshold}%</span>
            </div>
            <Slider value={[threshold]} onValueChange={([v]) => setThreshold(v)} min={0} max={100} step={1} />
          </div>

          {/* Min score */}
          <div className='mt-4 space-y-1.5'>
            <Label className='text-xs'>Min. reach score</Label>
            <Input
              value={score}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '')
                setScore(v === '' ? 0 : parseInt(v, 10))
              }}
              inputMode='numeric'
            />
            <p className='text-[11px] text-muted-foreground'>
              Only mentions with reach score above this value get auto-replies.
            </p>
          </div>

          {/* Comment count range */}
          <div className='mt-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs'>Bot comments per post</Label>
              <span className='text-sm font-medium'>
                {countRange[0]} – {countRange[1]}
              </span>
            </div>
            <Slider
              value={countRange}
              onValueChange={(v) => setCountRange(v as [number, number])}
              min={0}
              max={10}
              step={1}
            />
          </div>

          {/* Rules */}
          <div className='mt-4 space-y-1.5'>
            <Label className='text-xs'>
              Reply rules{' '}
              <span className='font-normal text-muted-foreground'>(optional)</span>
            </Label>
            <Textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder='Instructions for AI when writing replies…'
              className='min-h-[72px] resize-y text-sm'
            />
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
