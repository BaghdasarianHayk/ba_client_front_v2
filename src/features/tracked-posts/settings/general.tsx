import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useProjectStore } from '@/stores/project-store'
import { PostService } from '@/services/api/post-service'
import { useRegisterSave } from '@/hooks/use-settings-save'

export function TrackedPostGeneral() {
  const navigate = useNavigate()
  const { postId } = useParams({ strict: false }) as { postId?: string }
  const { url: initialUrl } = useSearch({ strict: false }) as { url?: string }
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const isNew = !postId || postId === 'new'

  const [url, setUrl] = useState(initialUrl ?? '')
  const [active, setActive] = useState(true)
  const [loaded, setLoaded] = useState(isNew)

  useEffect(() => {
    if (isNew || !projectId || !postId) return
    PostService.getPost(projectId, postId)
      .then((p) => {
        setUrl(p.url)
        setActive(p.status === 'active')
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [isNew, postId, projectId])

  const handleSave = async () => {
    if (!projectId || !url.trim()) return
    try {
      if (isNew) {
        const created = await PostService.createPost(projectId, {
          post_url: url.trim(),
          status: active ? 'active' : 'inactive',
          comment_count_min: null,
          comment_count_max: null,
          autoreact_comment_threshold: 101,
          autoreply_comment_threshold: 101,
          autoreact_comment_score_threshold: 0,
          autoreply_comment_score_threshold: 0,
          autoreact_sentiments: {},
          autoreply_sentiments: [
            'POSITIVE',
            'NEGATIVE',
            'QUESTION',
            'NEUTRAL',
          ],
        })
        toast.success('Post tracking started')
        navigate({
          to: `/tracked-posts/${created.id}/settings`,
          replace: true,
        })
      } else {
        await PostService.updatePost(projectId, postId!, {
          status: active ? 'active' : 'inactive',
        })
        toast.success('Post updated')
      }
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    }
  }

  useRegisterSave({
    id: 'tracked-post-general',
    handler: handleSave,
    disabled: !url.trim(),
    label: isNew ? 'Start Tracking' : 'Save Changes',
  })

  if (!loaded) return null

  return (
      <div className='space-y-5'>
        <div className='space-y-1.5'>
          <Label className='text-xs'>Post URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder='https://t.me/channel/123 or post link'
            disabled={!isNew}
            autoFocus={isNew}
          />
          {isNew && (
            <p className='text-[11px] text-muted-foreground'>
              Paste a link to any Telegram post. The system will monitor its comments and let you set up auto-reply rules.
            </p>
          )}
          {!isNew && (
            <p className='text-[11px] text-muted-foreground'>
              Post URL cannot be changed after creation.
            </p>
          )}
        </div>

        <div className='flex items-center justify-between'>
          <div>
            <Label className='text-sm'>Active monitoring</Label>
            <p className='text-[11px] text-muted-foreground'>
              When disabled, no new comments will be fetched.
            </p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
      </div>
  )
}
