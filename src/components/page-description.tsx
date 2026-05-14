import { useState } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type PageDescriptionProps = {
  /** Short one-line description always visible */
  summary: string
  /** Optional longer explanation shown on expand */
  details?: string | React.ReactNode
  /** Optional className */
  className?: string
}

/**
 * A collapsible page-level description block.
 * Shows a brief summary with an optional expandable section for more details.
 * Helps users understand what a page does, especially on first visit.
 */
export function PageDescription({
  summary,
  details,
  className,
}: PageDescriptionProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        'rounded-lg border border-border/60 bg-muted/30 px-3 py-2',
        className
      )}
    >
      <div className='flex items-start gap-2'>
        <Info className='mt-0.5 size-3.5 shrink-0 text-muted-foreground/70' />
        <div className='min-w-0 flex-1'>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {summary}
          </p>
          {details && expanded && (
            <div className='mt-1.5 text-xs leading-relaxed text-muted-foreground/80'>
              {typeof details === 'string' ? <p>{details}</p> : details}
            </div>
          )}
        </div>
        {details && (
          <button
            type='button'
            onClick={() => setExpanded(!expanded)}
            className='shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-muted-foreground'
          >
            {expanded ? (
              <ChevronUp className='size-3.5' />
            ) : (
              <ChevronDown className='size-3.5' />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
