import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { InfoTooltip } from '@/components/info-tooltip'
import { useProjectStore } from '@/stores/project-store'
import { PostService } from '@/services/api/post-service'
import { useRegisterSave } from '@/hooks/use-settings-save'

export function TrackedPostAutoReply() {
  const { postId } = useParams({ strict: false }) as { postId?: string }
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const isNew = !postId || postId === 'new'

  const [enabled, setEnabled] = useState(false)
  const [threshold, setThreshold] = useState(70)
  const [countRange, setCountRange] = useState<[number, number]>([0, 10])
  const [rules, setRules] = useState('')
  const [loaded, setLoaded] = useState(isNew)

  useEffect(() => {
    if (isNew || !projectId || !postId) return
    PostService.getPost(projectId, postId)
      .then((p) => {
        setEnabled(p.autoReply.enabled)
        setThreshold(p.autoReply.threshold)
        setCountRange([p.autoReply.countMin, p.autoReply.countMax])
        setRules(p.autoReply.aiPrompt)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [isNew, postId, projectId])

  const handleSave = async () => {
    if (!projectId || !postId || isNew) return
    try {
      await PostService.updatePost(projectId, postId, {
        autoreply_comment_threshold: enabled ? threshold : 101,
        autoreply_comment_score_threshold: 0,
        comment_count_min: countRange[0],
        comment_count_max: countRange[1],
        additional_hint_reply: rules || undefined,
        autoreply_sentiments: [
          'POSITIVE',
          'NEGATIVE',
          'QUESTION',
          'NEUTRAL',
        ],
      })
      toast.success('Auto reply settings saved')
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    }
  }

  useRegisterSave({
    id: 'tracked-post-auto-reply',
    handler: handleSave,
  })

  if (!loaded) return null

  return (
      <div className='space-y-5'>
        <div className='flex items-center justify-between'>
          <div>
            <Label className='text-sm'>Enable auto reply</Label>
            <p className='text-[11px] text-muted-foreground'>
              AI will automatically reply to matching comments.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className={enabled ? '' : 'pointer-events-none opacity-40'}>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <Label className='text-xs'>Min. relevance</Label>
                <InfoTooltip content='Only auto-reply to comments with relevance above this threshold. Higher = fewer but more targeted replies.' />
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
              Only comments above this relevance get auto-replies.
            </p>
          </div>

          <div className='mt-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <Label className='text-xs'>Bot comments per post</Label>
                <InfoTooltip content='Limits how many automated replies the bot can leave on this post. Use a range to add natural variation.' />
              </div>
              <span className='text-sm font-medium'>
                {countRange[0]} – {countRange[1]}
              </span>
            </div>
            <Slider
              value={countRange}
              onValueChange={(v) =>
                setCountRange(v as [number, number])
              }
              min={0}
              max={10}
              step={1}
            />
          </div>

          <div className='mt-4 space-y-1.5'>
            <div className='flex items-center gap-1.5'>
              <Label className='text-xs'>
                Reply rules{' '}
                <span className='font-normal text-muted-foreground'>
                  (optional)
                </span>
              </Label>
              <InfoTooltip content='Custom instructions for the AI when writing replies to this post. Example: "Be friendly and mention our free trial" or "Answer technical questions with links to docs."' />
            </div>
            <Textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder={'Example:\n• Answer questions about pricing\n• Be helpful and concise\n• Link to docs when relevant'}
              className='min-h-[96px] resize-y text-sm'
            />
          </div>
        </div>
      </div>
  )
}
