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
import { PostService } from '@/services/api/post-service'

export function TrackedPostAutoReply() {
  const { postId } = useParams({ strict: false }) as { postId?: string }
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const isNew = !postId || postId === 'new'

  const [enabled, setEnabled] = useState(false)
  const [threshold, setThreshold] = useState(70)
  const [countRange, setCountRange] = useState<[number, number]>([0, 10])
  const [rules, setRules] = useState('')
  const [saving, setSaving] = useState(false)
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
    setSaving(true)
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
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <ContentSection
      title='Auto Reply'
      desc='Automatically reply to comments on this post.'
    >
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
              <Label className='text-xs'>Min. relevance</Label>
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
              <Label className='text-xs'>Bot comments per post</Label>
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
            <Label className='text-xs'>
              Reply rules{' '}
              <span className='font-normal text-muted-foreground'>
                (optional)
              </span>
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
