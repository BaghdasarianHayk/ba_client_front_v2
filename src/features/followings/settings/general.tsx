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
import { ChannelService } from '@/services/api/channel-service'

export function FollowingGeneral() {
  const navigate = useNavigate()
  const { channelId } = useParams({ strict: false }) as { channelId?: string }
  const { username: initialUsername } = useSearch({ strict: false }) as { username?: string }
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const isNew = !channelId || channelId === 'new'

  const [username, setUsername] = useState(initialUsername ?? '')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(isNew)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isNew || !projectId || !channelId) return
    ChannelService.getChannel(projectId, channelId).then((ch) => {
      setUsername(ch.username)
      setActive(ch.status === 'active')
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [isNew, channelId, projectId])

  const handleSave = async () => {
    if (!projectId || !username.trim()) return
    setSaving(true)
    try {
      if (isNew) {
        const created = await ChannelService.createChannel(projectId, {
          channel_username: username.trim().replace(/^@/, ''),
          status: active ? 'active' : 'paused',
          show_post_threshold: 50,
          autoreact_post_threshold: 101,
          autoreply_post_threshold: 101,
          autoreact_post_score_threshold: null,
          autoreply_post_score_threshold: null,
          autoreact_sentiments: {},
          autoreply_sentiments: ['POSITIVE', 'NEGATIVE', 'QUESTION', 'NEUTRAL'],
          comment_count_min: null,
          comment_count_max: null,
        })
        toast.success('Following created')
        navigate({ to: `/followings/${created.id}/settings`, replace: true })
      } else {
        await ChannelService.updateChannel(projectId, channelId!, {
          status: active ? 'active' : 'paused',
        })
        toast.success('Following updated')
      }
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!projectId || !channelId) return
    setDeleting(true)
    try {
      await ChannelService.deleteChannel(projectId, channelId)
      toast.success('Following deleted')
      navigate({ to: '/followings', replace: true })
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (!loaded) return null

  return (
    <ContentSection title='General' desc='Channel URL and monitoring status.'>
      <div className='space-y-5'>
        <div className='space-y-1.5'>
          <Label className='text-xs'>Channel Username</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder='@channel_name or t.me/channel_name'
            disabled={!isNew}
            autoFocus={isNew}
          />
          {!isNew && (
            <p className='text-[11px] text-muted-foreground'>
              Channel URL cannot be changed after creation.
            </p>
          )}
        </div>

        <div className='flex items-center justify-between'>
          <div>
            <Label className='text-sm'>Active</Label>
            <p className='text-[11px] text-muted-foreground'>
              When paused, no new posts will be fetched.
            </p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>

        <div className='flex items-center gap-2'>
          <Button onClick={handleSave} disabled={saving || !username.trim()}>
            {saving && <Loader2 className='animate-spin' />}
            {isNew ? 'Create Following' : 'Save Changes'}
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
              <AlertDialogTitle>Delete following?</AlertDialogTitle>
              <AlertDialogDescription>
                This will stop all monitoring and remove this channel. This cannot be undone.
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
