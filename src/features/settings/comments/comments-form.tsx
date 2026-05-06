import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useProjectStore } from '@/stores/project-store'
import { ProjectService } from '@/services/api/project-service'
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

const schema = z.object({
  topCount: z.coerce.number().int().min(1).max(20),
  minRelevance: z.coerce.number().int().min(0).max(100),
})

type FormValues = z.infer<typeof schema>

export function CommentsForm() {
  const { currentProject, fetchProjects } = useProjectStore()
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { topCount: 5, minRelevance: 50 },
  })

  useEffect(() => {
    if (!currentProject) return
    form.reset({
      topCount: currentProject.comment_preview_count || 5,
      minRelevance: currentProject.comment_preview_relevance || 50,
    })
  }, [currentProject, form])

  async function onSubmit(data: FormValues) {
    if (!currentProject) return
    setSaving(true)
    try {
      await ProjectService.updateProject(currentProject.id, {
        brand_name: currentProject.brand_name,
        brand_description: currentProject.brand_description,
        brand_website: currentProject.brand_website || '',
        brand_tags: currentProject.brand_tags || [],
        comment_preview_count: data.topCount,
        comment_preview_relevance: data.minRelevance,
      })
      await fetchProjects()
      toast.success('Comment settings updated')
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!currentProject) {
    return (
      <p className='text-sm text-muted-foreground'>
        Select a project to configure comment preview.
      </p>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='topCount'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Top Comments to Show</FormLabel>
              <FormControl>
                <Input
                  inputMode='numeric'
                  value={field.value}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '')
                    field.onChange(v === '' ? '' : Math.min(20, Math.max(1, parseInt(v, 10))))
                  }}
                  onBlur={() => {
                    const n = Number(field.value)
                    if (!n || n < 1) field.onChange(1)
                    else if (n > 20) field.onChange(20)
                  }}
                />
              </FormControl>
              <FormDescription>
                How many of the most relevant comments to display by default on
                each mention. Others are hidden behind "Show all".
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='minRelevance'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Relevance (%)</FormLabel>
              <FormControl>
                <Input
                  inputMode='numeric'
                  value={field.value}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '')
                    field.onChange(v === '' ? '' : Math.min(100, parseInt(v, 10)))
                  }}
                  onBlur={() => {
                    const n = Number(field.value)
                    if (isNaN(n) || n < 0) field.onChange(0)
                    else if (n > 100) field.onChange(100)
                  }}
                />
              </FormControl>
              <FormDescription>
                Only comments with relevance above this threshold appear in the
                preview. Lower values show more comments, higher values show
                only the most relevant.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={saving}>
          {saving && <Loader2 className='animate-spin' />}
          Save changes
        </Button>
      </form>
    </Form>
  )
}
