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
import { ChannelService } from '@/services/api/channel-service'

export function FollowingAutoComment() {
  const { channelId } = useParams({ strict: false }) as { channelId?: string }
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const isNew = !channelId || channelId === 'new'

  const [enabled, setEnabled] = useState(false)
  const [threshold, setThreshold] = useState(85)
  const [score, setScore] = useState(0)
  const [countRange, setCountRange] = useState<[number, number]>([0, 10])
  const [aiPrompt, setAiPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(isNew)

  useEffect(() => {
    if (isNew || !projectId || !channelId) return
    ChannelService.getChannel(projectId, channelId).then((ch) => {
      setEnabled(ch.autoComment.enabled)
      setThreshold(ch.autoComment.threshold)
      setScore(ch.autoComment.scoreThreshold)
      setCountRange([ch.autoComment.countMin, ch.autoComment.countMax])
      setAiPrompt(ch.autoComment.aiPrompt)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [isNew, channelId, projectId])

  const handleSave = async () => {
    if (!projectId || !channelId || isNew) return
    setSaving(true)
    try {
      await ChannelService.updateChannel(projectId, channelId, {
        autoreply_post_threshold: enabled ? threshold : 101,
        autoreply_post_score_threshold: score,
        comment_count_min: countRange[0],
        comment_count_max: countRange[1],
        additional_hint_reply: aiPrompt || undefined,
      })
      toast.success('Auto comment settings saved')
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <ContentSection title='Auto Comment' desc='Automatically reply to posts from this channel.'>
      <div className='space-y-5'>
        <div className='flex items-center justify-between'>
          <div>
            <Label className='text-sm'>Enable auto comment</Label>
            <p className='text-[11px] text-muted-foreground'>AI will post replies to matching posts.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className={enabled ? '' : 'pointer-events-none opacity-40'}>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs'>Min. relevance</Label>
              <span className='text-sm font-medium'>{threshold}%</span>
            </div>
            <Slider value={[threshold]} onValueChange={([v]) => setThreshold(v)} min={0} max={100} step={1} />
          </div>

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
          </div>

          <div className='mt-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs'>Bot comments per post</Label>
              <span className='text-sm font-medium'>{countRange[0]} – {countRange[1]}</span>
            </div>
            <Slider value={countRange} onValueChange={(v) => setCountRange(v as [number, number])} min={0} max={10} step={1} />
          </div>

          <div className='mt-4 space-y-1.5'>
            <Label className='text-xs'>AI prompt <span className='font-normal text-muted-foreground'>(optional)</span></Label>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
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
