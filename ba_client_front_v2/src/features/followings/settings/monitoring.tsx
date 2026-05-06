import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { ContentSection } from '@/features/settings/components/content-section'
import { useProjectStore } from '@/stores/project-store'
import { ChannelService } from '@/services/api/channel-service'

export function FollowingMonitoring() {
  const { channelId } = useParams({ strict: false }) as { channelId?: string }
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const isNew = !channelId || channelId === 'new'

  const [threshold, setThreshold] = useState(50)
  const [prompt, setPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(isNew)

  useEffect(() => {
    if (isNew || !projectId || !channelId) return
    ChannelService.getChannel(projectId, channelId).then((ch) => {
      setThreshold(ch.showThreshold)
      setPrompt(ch.filteringPrompt)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [isNew, channelId, projectId])

  const handleSave = async () => {
    if (!projectId || !channelId || isNew) return
    setSaving(true)
    try {
      await ChannelService.updateChannel(projectId, channelId, {
        show_post_threshold: threshold,
        additional_hint_search: prompt || undefined,
      })
      toast.success('Monitoring settings saved')
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <ContentSection title='Monitoring' desc='Control which posts from this channel appear as mentions.'>
      <div className='space-y-5'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label className='text-xs'>Min. relevance to show</Label>
            <span className='text-sm font-medium'>{threshold}%</span>
          </div>
          <Slider value={[threshold]} onValueChange={([v]) => setThreshold(v)} min={0} max={100} step={1} />
          <p className='text-[11px] text-muted-foreground'>
            Posts below this relevance won't appear in your feed.
          </p>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-xs'>Filtering prompt <span className='font-normal text-muted-foreground'>(optional)</span></Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Additional AI instructions for filtering…'
            className='min-h-[72px] resize-y text-sm'
          />
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
