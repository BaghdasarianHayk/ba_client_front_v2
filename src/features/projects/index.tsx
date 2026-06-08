import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  Calendar,
  Globe,
  Plus,
  Search,
  Share2,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectStore } from '@/stores/project-store'
import type { Project, SharedProject } from '@/services/api/types'

// ─── Project Card ────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onClick,
  shared,
}: {
  project: Project | SharedProject
  onClick: () => void
  shared?: boolean
}) {
  const sp = shared ? (project as SharedProject) : null
  return (
    <button
      type='button'
      onClick={onClick}
      className='group w-full cursor-pointer rounded-xl border bg-card p-5 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg'
    >
      <div className='mb-3 flex items-start justify-between'>
        <div className='flex items-center gap-2'>
          <h3 className='text-lg font-semibold transition-colors group-hover:text-primary'>
            {project.brand_name}
          </h3>
          {project.brand_tags?.length > 0 && (
            <Badge variant='secondary' className='shrink-0 text-[10px]'>
              {project.brand_tags[0]}
            </Badge>
          )}
        </div>
        <ArrowRight className='size-4 -translate-x-2 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100' />
      </div>

      {project.brand_description && (
        <p className='mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground'>
          {project.brand_description}
        </p>
      )}

      <div className='space-y-1.5 text-xs text-muted-foreground'>
        {project.brand_website && (
          <div className='flex items-center gap-2'>
            <Globe className='size-3.5' />
            <span className='truncate'>{project.brand_website}</span>
          </div>
        )}
        {sp ? (
          <>
            <div className='flex items-center gap-2'>
              <Users className='size-3.5' />
              <span>By {sp.owner_name || sp.owner_email}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant={sp.role === 'editor' ? 'default' : 'secondary'} className='text-[10px]'>
                {sp.role}
              </Badge>
            </div>
          </>
        ) : (
          <div className='flex items-center gap-2'>
            <Calendar className='size-3.5' />
            <span>Updated {formatDistanceToNow(new Date(project.last_search || project.updated_at), { addSuffix: true })}</span>
          </div>
        )}
      </div>

      {project.brand_tags.length > 0 && (
        <div className='mt-3 flex flex-wrap gap-1 border-t pt-3'>
          {project.brand_tags.map((tag) => (
            <Badge key={tag} variant='secondary' className='text-[10px]'>{tag}</Badge>
          ))}
        </div>
      )}
    </button>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const navigate = useNavigate()
  const {
    projects,
    sharedProjects,
    isLoading,
    fetchProjects,
    setCurrentProject,
  } = useProjectStore()

  const [search, setSearch] = useState('')

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.brand_name.toLowerCase().includes(search.toLowerCase()) ||
          p.brand_description.toLowerCase().includes(search.toLowerCase())
      ),
    [projects, search]
  )

  const handleSelect = useCallback(
    (project: Project | SharedProject) => {
      setCurrentProject(project as Project)
      navigate({ to: '/sheet' })
    },
    [setCurrentProject, navigate]
  )

  return (
    <div className='min-h-svh bg-background'>
      {/* Header */}
      <header className='border-b bg-card'>
        <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-4'>
          <div className='flex items-center gap-3'>
            <img src='/images/brand_advocate_logo.png' alt='Brand Advocate' className='size-8' />
            <h1 className='text-lg font-semibold'>Projects</h1>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <div className='relative hidden sm:block'>
              <Search className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search…'
                className='h-9 w-48 pl-8'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button className='gap-1.5' onClick={() => navigate({ to: '/projects/new' })}>
              <Plus className='size-4' />
              <span className='hidden sm:inline'>New Project</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className='mx-auto max-w-5xl px-4 py-8'>
        {/* Loading */}
        {isLoading && (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='rounded-xl border p-5'>
                <Skeleton className='mb-3 h-6 w-32' />
                <Skeleton className='mb-2 h-4 w-full' />
                <Skeleton className='mb-4 h-4 w-3/4' />
                <Skeleton className='h-3 w-40' />
              </div>
            ))}
          </div>
        )}

        {/* Owned projects */}
        {!isLoading && filtered.length > 0 && (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => handleSelect(p)} />
            ))}
          </div>
        )}

        {/* Empty — has projects but search filters them out */}
        {!isLoading && filtered.length === 0 && projects.length > 0 && (
          <div className='py-16 text-center text-muted-foreground'>
            <p>No projects match your search</p>
          </div>
        )}

        {/* Empty — no projects at all */}
        {!isLoading && projects.length === 0 && sharedProjects.length === 0 && (
          <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
            <p className='text-lg'>No projects yet</p>
            <p className='mt-1 text-sm'>Create your first project to start monitoring</p>
            <Button className='mt-4 gap-1.5' onClick={() => navigate({ to: '/projects/new' })}>
              <Plus className='size-4' />
              Create Project
            </Button>
          </div>
        )}

        {/* Shared projects */}
        {!isLoading && sharedProjects.length > 0 && (
          <div className='mt-12'>
            <div className='mb-4 flex items-center gap-2'>
              <Share2 className='size-4 text-muted-foreground' />
              <h2 className='text-sm font-semibold'>Shared with me</h2>
              <Badge variant='secondary' className='text-[10px]'>{sharedProjects.length}</Badge>
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {sharedProjects.map((p) => (
                <ProjectCard key={p.id} project={p} onClick={() => handleSelect(p)} shared />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
