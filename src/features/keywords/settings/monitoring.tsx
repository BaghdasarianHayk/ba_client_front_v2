import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { InfoTooltip } from '@/components/info-tooltip'
import { useProjectStore } from '@/stores/project-store'
import { KeywordService } from '@/services/api/keyword-service'
import { useRegisterSave } from '@/hooks/use-settings-save'

export function KeywordMonitoring() {
  const { keywordId } = useParams({ strict: false }) as { keywordId?: string }
  const { currentProject } = useProjectStore()
  const isNew = !keywordId || keywordId === 'new'

  const [active, setActive] = useState(true)
  const [threshold, setThreshold] = useState(50)
  const [prompt, setPrompt] = useState('')
  const [loaded, setLoaded] = useState(isNew)

  useEffect(() => {
    if (isNew || !currentProject) return
    KeywordService.getKeywords(currentProject.id).then((keywords) => {
      const found = keywords.find((k) => k.id === keywordId)
      if (found) {
        setActive(found.isActive)
        setThreshold(found.showThreshold)
        setPrompt(found.filteringPrompt)
      }
      setLoaded(true)
    })
  }, [isNew, keywordId, currentProject])

  const handleSave = async () => {
    if (!keywordId || isNew) return
    try {
      await KeywordService.updateKeyword(keywordId, {
        is_active: active,
        show_mention_threshold: threshold,
        additional_hint_search: prompt || undefined,
      } as any)
      toast.success('Monitoring settings saved')
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    }
  }

  useRegisterSave({
    id: 'keyword-monitoring',
    handler: handleSave,
  })

  if (!loaded) return null

  return (
      <div className='space-y-5'>
        {/* Active toggle */}
        <div className='flex items-center justify-between'>
          <div>
            <Label className='text-sm'>Monitor new posts</Label>
            <p className='text-[11px] text-muted-foreground'>
              When enabled, new posts matching this keyword will be tracked.
            </p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>

        {/* Min relevance */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1.5'>
              <Label className='text-xs'>Minimum relevance to show</Label>
              <InfoTooltip content='Relevance is an AI-calculated score (0-100%) showing how closely a post matches your keyword and brand context. Higher values mean stricter filtering.' />
            </div>
            <span className='text-sm font-medium'>{threshold}%</span>
          </div>
          <Slider
            value={[threshold]}
            onValueChange={([v]) => setThreshold(v)}
            min={0}
            max={100}
            step={1}
          />
          <p className='text-[11px] text-muted-foreground'>
            Posts below this relevance won't appear in your mentions feed.
          </p>
        </div>

        {/* Filtering prompt */}
        <div className='space-y-1.5'>
          <div className='flex items-center gap-1.5'>
            <Label className='text-xs'>
              Filtering prompt{' '}
              <span className='font-normal text-muted-foreground'>(optional)</span>
            </Label>
            <InfoTooltip content='Give the AI extra instructions on how to judge relevance. For example: "Ignore posts about crypto mining, only show posts about crypto wallets" or "Focus on posts asking questions about our product."' />
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Additional AI instructions for filtering relevance…'
            className='min-h-[72px] resize-y text-sm'
          />
        </div>
      </div>
  )
}
