import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, MessageSquare, Rss, Settings2, SmilePlus, Trash2 } from 'lucide-react'
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
import { PostService } from '@/services/api/post-service'
import { TrackedPostGeneral } from './general'
import { TrackedPostAutoReply } from './auto-reply'
import { TrackedPostAutoReact } from './auto-react'

const NAV_ITEMS: ScrollSpyItem[] = [
  { id: 'general', title: 'General', icon: <Settings2 size={18} /> },
  { id: 'auto-reply', title: 'Auto Reply', icon: <MessageSquare size={18} /> },
  { id: 'auto-react', title: 'Auto React', icon: <SmilePlus size={18} /> },
]

export function TrackedPostSettings() {
  const navigate = useNavigate()
  const { postId } = useParams({ strict: false }) as { postId?: string }
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id
  const isNew = !postId || postId === 'new'

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
          <Rss className='size-4 text-muted-foreground' />
          {isNew ? 'Track New Post' : 'Post Settings'}
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
              <TrackedPostGeneral />
            </section>

            {!isNew && (
              <>
                <section id='auto-reply' className='scroll-mt-20'>
                  <TrackedPostAutoReply />
                </section>
                <section id='auto-react' className='scroll-mt-20'>
                  <TrackedPostAutoReact />
                </section>
              </>
            )}
          </div>
        </div>
      </Main>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop tracking this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop all monitoring and automated actions for this post. This cannot be undone.
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
