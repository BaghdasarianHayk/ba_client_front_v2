import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  Calendar,
  Globe,
  Loader2,
  Plus,
  Search,
  Share2,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useProjectStore } from '@/stores/project-store'
import { ProjectService } from '@/services/api/project-service'
import type { Project, SharedProject } from '@/services/api/types'

// ─── Create Dialog ───────────────────────────────────────────────────────────

function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const navigate = useNavigate()
  const { fetchProjects, setCurrentProject } = useProjectStore()

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [website, setWebsite] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setName(''); setDesc(''); setWebsite(''); setTags([]); setTagInput('')
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) { setTags((p) => [...p, t]); setTagInput('') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !desc.trim()) return
    setSaving(true)
    try {
      const project = await ProjectService.createProject({
        brand_name: name.trim(),
        brand_description: desc.trim(),
        brand_website: website.trim() || undefined,
        brand_tags: tags.length ? tags : undefined,
      })
      toast.success('Project created')
      await fetchProjects()
      setCurrentProject(project)
      onOpenChange(false)
      reset()
      navigate({ to: '/keywords' })
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !saving) { reset(); onOpenChange(false) } else onOpenChange(o) }}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Add a brand to monitor across social platforms.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs'>Brand Name <span className='text-destructive'>*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Acme Corp' disabled={saving} autoFocus />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs'>Description <span className='text-destructive'>*</span></Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder='What does this brand do?' rows={3} disabled={saving} />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs'>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder='acme.com' disabled={saving} />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs'>Tags</Label>
            {tags.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {tags.map((t) => (
                  <Badge key={t} variant='secondary' className='gap-1 pr-1'>
                    {t}
                    <button type='button' onClick={() => setTags((p) => p.filter((x) => x !== t))} disabled={saving}>
                      <X className='size-3' />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className='flex gap-2'>
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} placeholder='Type + Enter' disabled={saving} />
              <Button type='button' variant='outline' size='icon' onClick={addTag} disabled={!tagInput.trim() || saving}><Plus className='size-4' /></Button>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type='submit' disabled={saving || !name.trim() || !desc.trim()}>
              {saving && <Loader2 className='mr-2 size-4 animate-spin' />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
        <h3 className='text-lg font-semibold transition-colors group-hover:text-primary'>
          {project.brand_name}
        </h3>
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
    currentProject,
    isLoading,
    fetchProjects,
    setCurrentProject,
  } = useProjectStore()

  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

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
            <Button className='gap-1.5' onClick={() => setCreateOpen(true)}>
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
            <Button className='mt-4 gap-1.5' onClick={() => setCreateOpen(true)}>
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

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
