import { Angry, Meh, MessageCircleQuestion, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'

type SentimentId = 'positive' | 'neutral' | 'negative' | 'question'

const SENTIMENTS: {
  id: SentimentId
  label: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
}[] = [
  { id: 'positive', label: 'Positive', icon: Smile, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'negative', label: 'Negative', icon: Angry, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  { id: 'question', label: 'Question', icon: MessageCircleQuestion, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
]

export function SentimentSelector({
  value,
  onChange,
}: {
  value: Set<SentimentId>
  onChange: (v: Set<SentimentId>) => void
}) {
  const toggle = (id: SentimentId) => {
    const next = new Set(value)
    next.has(id) ? next.delete(id) : next.add(id)
    onChange(next)
  }

  return (
    <div className='flex flex-wrap gap-1'>
      {SENTIMENTS.map(({ id, label, icon: Icon, color, bg, border }) => {
        const on = value.has(id)
        return (
          <button
            key={id}
            type='button'
            onClick={() => toggle(id)}
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors',
              on ? cn(bg, border, color) : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className='size-3.5' />
            {label}
          </button>
        )
      })}
    </div>
  )
}
