import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Lightbulb, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type PageDescriptionProps = {
  /** Unique key for localStorage persistence (e.g. 'keywords-page') */
  id: string
  /** Short one-line description always visible */
  summary: string
  /** Optional longer explanation shown on expand */
  details?: string | React.ReactNode
  /** Optional Help Center section anchor (e.g. 'keywords') */
  helpAnchor?: string
  /** Optional className */
  className?: string
}

const STORAGE_PREFIX = 'ba_hint_dismissed_'

/**
 * A dismissable page-level hint.
 * Compact, non-intrusive, disappears permanently on dismiss.
 */
export function PageDescription({
  id,
  summary,
  details,
  helpAnchor,
  className,
}: PageDescriptionProps) {
  const storageKey = `${STORAGE_PREFIX}${id}`
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(storageKey) === '1'
  )

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(storageKey, '1')
    setDismissed(true)
  }

  return (
    <div
      className={cn(
        'group relative rounded-md bg-muted/50 px-3 py-2.5',
        className
      )}
    >
      {/* Dismiss — appears on hover, always accessible */}
      <button
        type='button'
        onClick={handleDismiss}
        className='absolute end-2 top-2 rounded-sm p-0.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60 hover:!text-muted-foreground'
        aria-label='Dismiss'
      >
        <X className='size-3.5' />
      </button>

      <div className='flex items-start gap-2.5 pe-6'>
        <Lightbulb className='mt-0.5 size-3.5 shrink-0 text-amber-500/70' />
        <div className='min-w-0 space-y-1'>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {summary}
          </p>
          {details && (
            <p className='text-[11px] leading-relaxed text-muted-foreground/70'>
              {typeof details === 'string' ? details : details}
            </p>
          )}
          {helpAnchor && (
            <Link
              to='/help-center'
              hash={helpAnchor}
              className='inline-block text-[11px] font-medium text-primary/80 transition-colors hover:text-primary hover:underline'
            >
              Learn more →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
