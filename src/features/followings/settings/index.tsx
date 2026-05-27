import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Eye, MessageSquare, Radio, Settings2, SmilePlus, Trash2 } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { HeaderSaveButton } from '@/components/header-save-button'
import { ScrollSpyNav, type ScrollSpyItem } from '@/components/scroll-spy-nav'
import { useProjectStore } from '@/stores/project-store'
import { ChannelService } from '@/services/api/channel-service'
import { FollowingGeneral } from './general'
import { FollowingMonitoring } from './monitoring'
import { FollowingAutoComment } from './auto-comment'
import { FollowingReactPosts } from './react-posts'

const NAV_ITEMS: ScrollSpyItem[] = [
  { id: 'general', title: 'General', icon: <Settings2 size={18} /> },
  { id: 'monitoring', title: 'Monitoring', icon: <Eye size={18} /> },
  { id: 'auto-comment', title: 'Auto Comment', icon: <MessageSquare size={18} /> },
  { id: 'react-posts', title: 'React to Posts', icon: <SmilePlus size={18} /> },
]

export function FollowingSettings() {
  const navigate = useNavigate()
  const { channelId } = useParams({ strict: false }) as { channelId?: string }
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const isNew = !channelId || channelId === 'new'

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!projectId || !channelId) return
    setDeleting(true)
    try {
      await ChannelService.deleteChannel(projectId, channelId)
      toast.success('Channel deleted')
      navigate({ to: '/followings', replace: true })
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <Header fixed hideSidebarTrigger>
        <Button
          variant='ghost'
          size='icon'
          className='size-8'
          onClick={() => window.history.back()}
        >
          <ArrowLeft className='size-4' />
        </Button>
        <Separator orientation='vertical' className='h-5' />
        <h1 className='flex items-center gap-1.5 text-sm font-semibold'>
          <Radio className='size-4 text-muted-foreground' />
          {isNew ? 'New Tracked Channel' : 'Channel Settings'}
        </h1>
        <div className='ms-auto flex items-center gap-2'>
          <HeaderSaveButton />
          {!isNew && (
            <Button
              variant='ghost'
              size='icon'
              className='size-8 text-destructive hover:bg-destructive/10 hover:text-destructive'
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className='size-4' />
            </Button>
          )}
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='flex flex-1 flex-col gap-4 lg:flex-row lg:gap-12'>
          {!isNew && (
            <aside className='top-20 shrink-0 self-start lg:sticky lg:w-48'>
              <ScrollSpyNav items={NAV_ITEMS} />
            </aside>
          )}

          <div className='flex-1 space-y-10'>
            <section id='general' className='scroll-mt-20'>
              <FollowingGeneral />
            </section>

            {!isNew && (
              <>
                <section id='monitoring' className='scroll-mt-20'>
                  <FollowingMonitoring />
                </section>
                <section id='auto-comment' className='scroll-mt-20'>
                  <FollowingAutoComment />
                </section>
                <section id='react-posts' className='scroll-mt-20'>
                  <FollowingReactPosts />
                </section>
              </>
            )}
          </div>
        </div>
      </Main>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tracked channel?</AlertDialogTitle>
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
    </>
  )
}
