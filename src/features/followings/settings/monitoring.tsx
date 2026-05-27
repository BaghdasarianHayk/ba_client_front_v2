import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { InfoTooltip } from '@/components/info-tooltip'
import { ContentSection } from '@/features/settings/components/content-section'
import { useProjectStore } from '@/stores/project-store'
import { ChannelService } from '@/services/api/channel-service'
import { useSettingsSave } from '@/hooks/use-settings-save'

export function FollowingMonitoring() {
  const { channelId } = useParams({ strict: false }) as { channelId?: string }
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const isNew = !channelId || channelId === 'new'

  const [threshold, setThreshold] = useState(50)
  const [prompt, setPrompt] = useState('')
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
    try {
      await ChannelService.updateChannel(projectId, channelId, {
        show_post_threshold: threshold,
        additional_hint_search: prompt || undefined,
      })
      toast.success('Monitoring settings saved')
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    }
  }

  const { register, unregister } = useSettingsSave()
  useEffect(() => {
    if (isNew) return
    register({ handler: handleSave })
    return unregister
  })

  if (!loaded) return null

  return (
    <ContentSection title='Monitoring' desc='Control which posts from this channel appear as mentions.'>
      <div className='space-y-5'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1.5'>
              <Label className='text-xs'>Min. relevance to show</Label>
              <InfoTooltip content='Relevance is an AI score (0-100%) showing how closely a post relates to your brand. Posts below this threshold are hidden from your feed.' />
            </div>
            <span className='text-sm font-medium'>{threshold}%</span>
          </div>
          <Slider value={[threshold]} onValueChange={([v]) => setThreshold(v)} min={0} max={100} step={1} />
          <p className='text-[11px] text-muted-foreground'>
            Posts below this relevance won't appear in your feed.
          </p>
        </div>

        <div className='space-y-1.5'>
          <div className='flex items-center gap-1.5'>
            <Label className='text-xs'>Filtering prompt <span className='font-normal text-muted-foreground'>(optional)</span></Label>
            <InfoTooltip content='Extra instructions for the AI when judging post relevance. Example: "Only show posts that mention our product directly, ignore general industry news."' />
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Additional AI instructions for filtering…'
            className='min-h-[72px] resize-y text-sm'
          />
        </div>
      </div>
    </ContentSection>
  )
}
