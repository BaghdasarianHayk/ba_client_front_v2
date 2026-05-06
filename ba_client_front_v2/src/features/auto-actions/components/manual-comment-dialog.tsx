import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Link, Loader2, MessageSquarePlus } from 'lucide-react'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { PlatformIcon, type PlatformId } from '@/components/platform-icon'
import { PosterService } from '@/services/api/poster-service'

// Simple platform detection from URL
function detectPlatform(url: string): PlatformId | null {
  const u = url.toLowerCase()
  if (u.includes('t.me') || u.includes('telegram')) return 'telegram'
  if (u.includes('reddit.com')) return 'reddit'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'x'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('tiktok.com')) return 'tiktok'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('facebook.com') || u.includes('fb.com')) return 'facebook'
  return null
}

interface ManualCommentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManualCommentDialog({
  open,
  onOpenChange,
}: ManualCommentDialogProps) {
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const platform = useMemo(() => detectPlatform(url), [url])
  const isValid = url.trim().length > 0 && content.trim().length > 0 && platform !== null

  const handleSubmit = useCallback(async () => {
    if (!isValid) return
    setSubmitting(true)
    try {
      await PosterService.createManualComment({
        url: url.trim(),
        content: content.trim(),
      })
      toast.loading('Publishing…', {
        id: 'poster-processing-toast',
        duration: 30000,
      })
      setUrl('')
      setContent('')
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }, [isValid, url, content, onOpenChange])

  const handleClose = (o: boolean) => {
    if (!o) {
      setUrl('')
      setContent('')
    }
    onOpenChange(o)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquarePlus className='size-5' />
            Manual Comment
          </DialogTitle>
          <DialogDescription>
            Post a comment to any supported platform using the post URL.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* URL */}
          <div className='space-y-1.5'>
            <Label className='text-xs'>Post URL</Label>
            <div className='relative'>
              <Link className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='https://t.me/channel/123'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={submitting}
                className='pl-8'
              />
              {platform && (
                <div className='absolute right-2.5 top-1/2 -translate-y-1/2'>
                  <PlatformIcon platform={platform} size='sm' />
                </div>
              )}
            </div>
            {url.trim().length > 0 && !platform && (
              <p className='flex items-center gap-1 text-xs text-destructive'>
                <AlertCircle className='size-3' />
                Unsupported platform
              </p>
            )}
          </div>

          {/* Content */}
          <div className='space-y-1.5'>
            <Label className='text-xs'>Comment</Label>
            <Textarea
              placeholder='Write your comment…'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submitting}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => handleClose(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting && <Loader2 className='animate-spin' />}
            Post Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
