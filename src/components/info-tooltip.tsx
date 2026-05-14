import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type InfoTooltipProps = {
  /** The help text to display */
  content: string | React.ReactNode
  /** Optional icon size class */
  className?: string
  /** Side of the tooltip */
  side?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * A small "?" icon that shows a tooltip with contextual help.
 * Use next to labels, headings, or anywhere users might need clarification.
 */
export function InfoTooltip({
  content,
  className,
  side = 'top',
}: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type='button'
          className={cn(
            'inline-flex cursor-help items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-muted-foreground',
            className
          )}
          tabIndex={-1}
        >
          <HelpCircle className='size-3.5' />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className='max-w-[280px] text-xs leading-relaxed'
      >
        {content}
      </TooltipContent>
    </Tooltip>
  )
}
