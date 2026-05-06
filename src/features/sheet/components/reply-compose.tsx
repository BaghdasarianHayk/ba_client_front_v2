import { useCallback, useRef, useState } from 'react'
import { ArrowUp, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ProjectService } from '@/services/api/project-service'

export type ThreadComment = { comment: string; is_target: boolean }

type ReplyComposeProps = {
  onClose: () => void
  placeholder?: string
  variant?: 'post' | 'comment'
  className?: string
  /** Project ID — required for AI generation */
  projectId?: string
  /** The comment/post content to generate a reply for */
  commentBody?: string
  /** Keyword ID associated with the mention (improves AI quality) */
  keywordId?: string
  /** Ancestor comment chain for context-aware replies */
  commentThread?: ThreadComment[]
  /** Callback to send the reply via poster API */
  onSend?: (text: string) => Promise<void>
}

export function ReplyCompose({
  onClose,
  placeholder = 'Write a reply…',
  variant = 'comment',
  className,
  projectId,
  commentBody,
  keywordId,
  commentThread,
  onSend,
}: ReplyComposeProps) {
  const [text, setText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasText = text.trim().length > 0
  const canGenerate = Boolean(projectId && commentBody)

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    resize()
  }

  const handleGenerate = useCallback(async () => {
    if (!projectId || !commentBody) {
      toast.error('Unable to generate: missing context')
      return
    }
    setGenerating(true)
    try {
      const res = await ProjectService.getReplySuggestion(
        projectId,
        commentBody,
        keywordId,
        commentThread
      )
      setText(res.reply_suggestion)
      requestAnimationFrame(resize)
    } catch (err: any) {
      toast.error(
        err.detail || err.message || 'Failed to generate reply'
      )
    } finally {
      setGenerating(false)
    }
  }, [projectId, commentBody, keywordId, commentThread])

  const handleSend = useCallback(async () => {
    if (!hasText || !onSend) return
    setSending(true)
    try {
      await onSend(text.trim())
      setText('')
      onClose()
      // Keep the user informed while the poster task is processed in the background.
      // Dismissed by notifications handler (task-store / poster completed event).
      toast.loading('Publishing…', {
        id: 'poster-processing-toast',
        duration: 30000,
      })
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }, [text, hasText, onSend, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && hasText) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-background shadow-sm transition-shadow focus-within:shadow-md',
        variant === 'post' ? 'mt-1' : 'mt-2',
        className
      )}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={generating}
        rows={2}
        className={cn(
          'w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-sm leading-relaxed',
          'placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-60'
        )}
        autoFocus
      />

      <div className='flex items-center gap-1 px-2 pb-2'>
        {/* AI Generate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground'
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
            >
              {generating ? (
                <Loader2 className='size-3.5 animate-spin' />
              ) : (
                <Sparkles className='size-3.5 text-purple-500' />
              )}
              <span className='hidden sm:inline'>
                {generating ? 'Generating…' : 'AI'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {canGenerate
              ? 'Generate reply with AI'
              : 'AI generation unavailable (no context)'}
          </TooltipContent>
        </Tooltip>

        <div className='flex-1' />

        {/* Cancel */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-7 rounded-full text-muted-foreground'
              onClick={onClose}
            >
              <X className='size-3.5' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancel (Esc)</TooltipContent>
        </Tooltip>

        {/* Send */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              className={cn(
                'size-7 rounded-full transition-all',
                hasText
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground'
              )}
              disabled={!hasText || sending || !onSend}
              onClick={handleSend}
            >
              {sending ? (
                <Loader2 className='size-3.5 animate-spin' />
              ) : (
                <ArrowUp className='size-3.5' />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send (⌘↵)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
