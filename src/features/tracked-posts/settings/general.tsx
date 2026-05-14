import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ContentSection } from '@/features/settings/components/content-section'
import { useProjectStore } from '@/stores/project-store'
import { PostService } from '@/services/api/post-service'

export function TrackedPostGeneral() {
  const navigate = useNavigate()
  const { postId } = useParams({ strict: false }) as { postId?: string }
  const { url: initialUrl } = useSearch({ strict: false }) as { url?: string }
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const isNew = !postId || postId === 'new'

  const [url, setUrl] = useState(initialUrl ?? '')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(isNew)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    setSaving(true)
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
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!projectId || !postId) return
    setDeleting(true)
    try {
      await PostService.deletePost(projectId, postId)
      toast.success('Post tracking removed')
      navigate({ to: '/tracked-posts', replace: true })
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (!loaded) return null

  return (
    <ContentSection
      title='General'
      desc='Post URL and monitoring status.'
    >
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

        <div className='flex items-center gap-2'>
          <Button
            onClick={handleSave}
            disabled={saving || !url.trim()}
          >
            {saving && <Loader2 className='animate-spin' />}
            {isNew ? 'Start Tracking' : 'Save Changes'}
          </Button>

          {!isNew && (
            <Button
              variant='destructive'
              size='sm'
              className='gap-1.5'
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className='size-3.5' />
              Delete
            </Button>
          )}
        </div>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Stop tracking this post?</AlertDialogTitle>
              <AlertDialogDescription>
                This will stop all monitoring and automated actions for this
                post. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ContentSection>
  )
}
