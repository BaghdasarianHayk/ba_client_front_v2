import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ChevronsUpDown, FolderOpen, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useProjectStore } from '@/stores/project-store'

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const {
    projects,
    sharedProjects,
    currentProject,
    isLoading,
    fetchProjects,
    setCurrentProject,
  } = useProjectStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const allProjects = [...projects, ...sharedProjects]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <img src='/images/brand_advocate_logo.png' alt='Brand Advocate' className='size-5' />
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='flex items-center gap-1.5 truncate font-semibold'>
                  {isLoading
                    ? 'Loading…'
                    : currentProject?.brand_name ?? 'Select Project'}
                  {currentProject?.brand_tags && currentProject.brand_tags.length > 0 && (
                    <span className='inline-flex shrink-0 items-center rounded-md border border-primary/30 bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary'>
                      {currentProject.brand_tags[0]}
                    </span>
                  )}
                </span>
                <span className='truncate text-xs text-muted-foreground'>
                  {currentProject
                    ? currentProject.brand_description.slice(0, 40)
                    : 'No project selected'}
                </span>
              </div>
              {isLoading ? (
                <Loader2 className='ms-auto size-4 animate-spin' />
              ) : (
                <ChevronsUpDown className='ms-auto' />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuItem
              onClick={() => navigate({ to: '/' })}
              className='gap-2 p-2 text-muted-foreground'
            >
              <ArrowLeft className='size-4' />
              <span className='text-xs font-medium'>Back to Projects</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {projects.length > 0 && (
              <>
                <DropdownMenuLabel className='text-xs text-muted-foreground'>
                  My Projects
                </DropdownMenuLabel>
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => {
                      setCurrentProject(project)
                      navigate({ to: '/sheet' })
                    }}
                    className='gap-2 p-2'
                  >
                    <div className='flex size-6 items-center justify-center rounded-sm border'>
                      <FolderOpen className='size-4 shrink-0' />
                    </div>
                    <div className='grid flex-1 leading-tight'>
                      <span className='flex items-center gap-1.5 truncate text-sm'>
                        {project.brand_name}
                        {project.brand_tags?.length > 0 && (
                          <span className='inline-flex shrink-0 items-center rounded-md border border-primary/30 bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary'>
                            {project.brand_tags[0]}
                          </span>
                        )}
                      </span>
                    </div>
                    {project.id === currentProject?.id && (
                      <span className='size-2 rounded-full bg-primary' />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {sharedProjects.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className='text-xs text-muted-foreground'>
                  Shared with me
                </DropdownMenuLabel>
                {sharedProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => {
                      setCurrentProject(project)
                      navigate({ to: '/sheet' })
                    }}
                    className='gap-2 p-2'
                  >
                    <div className='flex size-6 items-center justify-center rounded-sm border'>
                      <FolderOpen className='size-4 shrink-0' />
                    </div>
                    <div className='grid flex-1 leading-tight'>
                      <span className='flex items-center gap-1.5 truncate text-sm'>
                        {project.brand_name}
                        {project.brand_tags?.length > 0 && (
                          <span className='inline-flex shrink-0 items-center rounded-md border border-primary/30 bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary'>
                            {project.brand_tags[0]}
                          </span>
                        )}
                      </span>
                    </div>
                    {project.id === currentProject?.id && (
                      <span className='size-2 rounded-full bg-primary' />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {allProjects.length === 0 && !isLoading && (
              <div className='p-4 text-center text-sm text-muted-foreground'>
                No projects found
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
