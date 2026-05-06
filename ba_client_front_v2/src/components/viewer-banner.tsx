import { Eye, Info } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useViewerMode } from '@/hooks/use-viewer-mode'
import { useProjectStore } from '@/stores/project-store'

/**
 * Subtle fixed banner shown when the user is in viewer (read-only) mode.
 * Stays at the bottom of the viewport, doesn't demand attention but is always visible.
 * Includes an info button with details about viewer mode.
 */
export function ViewerBanner() {
  const { isViewer } = useViewerMode()
  const sharedProjects = useProjectStore((s) => s.sharedProjects)
  const currentProject = useProjectStore((s) => s.currentProject)

  if (!isViewer) return null

  const shared = sharedProjects.find((p) => p.id === currentProject?.id)
  const ownerName = shared?.owner_name || shared?.owner_email || 'the owner'

  return (
    <div className='fixed inset-x-0 bottom-0 z-50 flex items-center justify-center pointer-events-none'>
      <div className='pointer-events-auto mb-4 flex items-center gap-2 rounded-full border border-border/60 bg-background/90 px-4 py-1.5 shadow-lg backdrop-blur-sm'>
        <Eye className='size-3.5 text-muted-foreground' />
        <span className='text-xs font-medium text-muted-foreground'>
          View only
        </span>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type='button'
              className='rounded-full p-0.5 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground'
            >
              <Info className='size-3.5' />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side='top'
            align='center'
            className='w-64 text-sm'
          >
            <div className='space-y-2'>
              <p className='font-medium'>Viewer Mode</p>
              <p className='text-muted-foreground'>
                You have read-only access to this project shared by{' '}
                <span className='font-medium text-foreground'>
                  {ownerName}
                </span>
                .
              </p>
              <p className='text-muted-foreground'>
                You can browse mentions, comments, and settings but cannot make
                changes. Contact the project owner to request editor access.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
