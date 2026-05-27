import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useProjectStore } from '@/stores/project-store'
import { ChannelService } from '@/services/api/channel-service'
import { useRegisterSave } from '@/hooks/use-settings-save'

export function FollowingGeneral() {
  const navigate = useNavigate()
  const { channelId } = useParams({ strict: false }) as { channelId?: string }
  const { username: initialUsername } = useSearch({ strict: false }) as { username?: string }
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const isNew = !channelId || channelId === 'new'

  const [username, setUsername] = useState(initialUsername ?? '')
  const [active, setActive] = useState(true)
  const [loaded, setLoaded] = useState(isNew)

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
        toast.success('Channel created')
        navigate({ to: `/followings/${created.id}/settings`, replace: true })
      } else {
        await ChannelService.updateChannel(projectId, channelId!, {
          status: active ? 'active' : 'paused',
        })
        toast.success('Channel updated')
      }
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    }
  }

  useRegisterSave({
    id: 'following-general',
    handler: handleSave,
    disabled: !username.trim(),
    label: isNew ? 'Create Channel' : 'Save Changes',
  })

  if (!loaded) return null

  return (
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
          {isNew && (
            <p className='text-[11px] text-muted-foreground'>
              Enter a public Telegram channel username. All new posts will be analyzed and shown in your Mentions feed if relevant.
            </p>
          )}
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
      </div>
  )
}
