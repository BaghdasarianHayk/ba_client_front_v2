import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type EmptyStateProps = {
  /** Icon to display */
  icon: LucideIcon
  /** Main heading */
  title: string
  /** Description explaining what this section is for */
  description: string
  /** Optional tips or guidance items */
  tips?: string[]
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  /** Optional className */
  className?: string
}

/**
 * A rich empty state component with guidance.
 * Clean, centered layout with subtle visual hierarchy.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  tips,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted/80'>
        <Icon className='size-6 text-muted-foreground/70' />
      </div>
      <h3 className='text-sm font-semibold'>{title}</h3>
      <p className='mt-1.5 max-w-[320px] text-[13px] leading-relaxed text-muted-foreground'>
        {description}
      </p>

      {tips && tips.length > 0 && (
        <div className='mt-4 rounded-md bg-muted/40 px-4 py-2.5'>
          <ul className='space-y-1 text-start text-[11px] text-muted-foreground/80'>
            {tips.map((tip, i) => (
              <li key={i} className='flex items-start gap-2'>
                <span className='mt-[5px] size-1 shrink-0 rounded-full bg-muted-foreground/40' />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {action && (
        <Button size='sm' className='mt-5 gap-1.5' onClick={action.onClick}>
          {action.icon && <action.icon className='size-3.5' />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
