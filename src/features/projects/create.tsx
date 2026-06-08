import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Building2, Globe, Loader2, Plus, Sparkles, Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProjectStore } from '@/stores/project-store'
import { ProjectService } from '@/services/api/project-service'

export function CreateProjectPage() {
  const navigate = useNavigate()
  const { fetchProjects, setCurrentProject } = useProjectStore()

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [website, setWebsite] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      setTags((p) => [...p, t])
      setTagInput('')
    }
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
      navigate({ to: '/keywords' })
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = name.trim() && desc.trim() && !saving

  return (
    <div className='min-h-svh bg-background'>
      {/* Header */}
      <header className='sticky top-0 z-10 border-b bg-background/80 backdrop-blur-lg'>
        <div className='mx-auto flex max-w-2xl items-center gap-3 px-4 py-3'>
          <Button
            variant='ghost'
            size='icon'
            className='size-8'
            onClick={() => navigate({ to: '/' })}
            disabled={saving}
          >
            <ArrowLeft className='size-4' />
          </Button>
          <div>
            <h1 className='text-base font-semibold'>New Project</h1>
            <p className='text-xs text-muted-foreground'>
              Add a brand to monitor across social platforms
            </p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className='mx-auto max-w-2xl px-4 py-8'>
        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Brand name */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-1.5 text-sm font-medium'>
              <Building2 className='size-4 text-muted-foreground' />
              Brand Name <span className='text-destructive'>*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Acme Corp'
              disabled={saving}
              autoFocus
              className='h-11 text-base'
            />
            <p className='text-xs text-muted-foreground'>
              The brand or company name you want to track.
            </p>
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-1.5 text-sm font-medium'>
              <Sparkles className='size-4 text-muted-foreground' />
              Description <span className='text-destructive'>*</span>
            </Label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder='Describe what this brand does, its products, target audience, and anything else that helps the AI understand context for finding relevant mentions and generating replies…'
              rows={6}
              disabled={saving}
              className='resize-y text-base leading-relaxed'
            />
            <p className='text-xs text-muted-foreground'>
              The more detail you provide, the better the AI can suggest keywords and write on-brand replies.
            </p>
          </div>

          {/* Website */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-1.5 text-sm font-medium'>
              <Globe className='size-4 text-muted-foreground' />
              Website
            </Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder='acme.com'
              disabled={saving}
              className='h-11'
            />
          </div>

          {/* Tags */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-1.5 text-sm font-medium'>
              <Tag className='size-4 text-muted-foreground' />
              Tags
            </Label>
            <div className='flex gap-2'>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder='Type a tag and press Enter'
                disabled={saving}
                className='h-11'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='size-11 shrink-0'
                onClick={addTag}
                disabled={!tagInput.trim() || saving}
              >
                <Plus className='size-4' />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className='flex flex-wrap gap-1.5 pt-1'>
                {tags.map((t) => (
                  <Badge key={t} variant='secondary' className='gap-1 pr-1 text-sm'>
                    {t}
                    <button
                      type='button'
                      onClick={() => setTags((p) => p.filter((x) => x !== t))}
                      disabled={saving}
                      className='rounded-sm p-0.5 hover:bg-muted-foreground/20'
                    >
                      <X className='size-3' />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className='text-xs text-muted-foreground'>
              Optional. Tags help you organize and identify projects.
            </p>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 border-t pt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => navigate({ to: '/' })}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={!canSubmit} className='gap-1.5'>
              {saving && <Loader2 className='size-4 animate-spin' />}
              Create Project
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
