import { useEffect, useState, type KeyboardEvent } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useProjectStore } from '@/stores/project-store'
import { ProjectService } from '@/services/api/project-service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  brandName: z.string().min(1, 'Project name is required'),
  brandWebsite: z.string().optional(),
  brandDescription: z.string().min(1, 'Description is required'),
})

type FormValues = z.infer<typeof schema>

export function ProjectForm() {
  const { currentProject, fetchProjects } = useProjectStore()
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      brandName: '',
      brandWebsite: '',
      brandDescription: '',
    },
  })

  // Load project data
  useEffect(() => {
    if (!currentProject) return
    form.reset({
      brandName: currentProject.brand_name,
      brandWebsite: currentProject.brand_website || '',
      brandDescription: currentProject.brand_description,
    })
    setTags(currentProject.brand_tags || [])
  }, [currentProject, form])

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag))

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  async function onSubmit(data: FormValues) {
    if (!currentProject) return
    setSaving(true)
    try {
      await ProjectService.updateProject(currentProject.id, {
        brand_name: data.brandName,
        brand_description: data.brandDescription,
        brand_website: data.brandWebsite || '',
        brand_tags: tags,
      })
      await fetchProjects()
      toast.success('Project updated')
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!currentProject) {
    return (
      <p className='text-sm text-muted-foreground'>
        Select a project from the sidebar to manage settings.
      </p>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='brandName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Name</FormLabel>
              <FormControl>
                <Input placeholder='Acme Corp' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='brandWebsite'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Website{' '}
                <span className='font-normal text-muted-foreground'>
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Input placeholder='acme.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='brandDescription'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Describe your brand, products, and services…'
                  className='min-h-[120px] resize-y'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The AI uses this to suggest keywords and generate relevant
                replies. Be specific about what your brand does.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <div className='space-y-2'>
          <FormLabel>
            Tags{' '}
            <span className='font-normal text-muted-foreground'>
              (optional)
            </span>
          </FormLabel>
          <div className='flex gap-2'>
            <Input
              placeholder='Add a tag and press Enter'
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              className='flex-1'
            />
            <Button
              type='button'
              variant='outline'
              size='icon'
              onClick={addTag}
              disabled={!tagInput.trim()}
            >
              <Plus className='size-4' />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className='flex flex-wrap gap-1.5'>
              {tags.map((tag) => (
                <Badge key={tag} variant='secondary' className='gap-1 pr-1'>
                  {tag}
                  <button
                    type='button'
                    onClick={() => removeTag(tag)}
                    className='rounded-sm p-0.5 hover:bg-muted-foreground/20'
                  >
                    <X className='size-3' />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button type='submit' disabled={saving}>
          {saving && <Loader2 className='animate-spin' />}
          Save changes
        </Button>
      </form>
    </Form>
  )
}
