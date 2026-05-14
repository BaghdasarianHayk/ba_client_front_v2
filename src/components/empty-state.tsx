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
 * Shows icon, title, description, optional tips, and an action button.
 * Helps users understand what to do when a page/section has no data.
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
      <div className='mb-4 flex size-14 items-center justify-center rounded-full bg-muted'>
        <Icon className='size-7 text-muted-foreground' />
      </div>
      <h3 className='text-base font-semibold'>{title}</h3>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
        {description}
      </p>

      {tips && tips.length > 0 && (
        <ul className='mt-4 space-y-1 text-start text-xs text-muted-foreground'>
          {tips.map((tip, i) => (
            <li key={i} className='flex items-start gap-2'>
              <span className='mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/50' />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}

      {action && (
        <Button className='mt-5 gap-1.5' onClick={action.onClick}>
          {action.icon && <action.icon className='size-4' />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
