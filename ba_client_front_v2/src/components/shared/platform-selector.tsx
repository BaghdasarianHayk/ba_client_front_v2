import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlatformIcon, type PlatformId } from '@/components/platform-icon'

const PLATFORMS: { id: PlatformId; label: string }[] = [
  { id: 'reddit', label: 'Reddit' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'x', label: 'X' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'web', label: 'Web' },
]

export function PlatformSelector({
  value,
  onChange,
}: {
  value: PlatformId[]
  onChange: (v: PlatformId[]) => void
}) {
  const toggle = (id: PlatformId) => {
    onChange(
      value.includes(id) ? value.filter((p) => p !== id) : [...value, id]
    )
  }

  return (
    <div className='flex flex-wrap gap-1'>
      {PLATFORMS.map(({ id }) => {
        const on = value.includes(id)
        return (
          <button
            key={id}
            type='button'
            onClick={() => toggle(id)}
            className={cn(
              'flex items-center gap-1 rounded-full border p-1 transition-colors',
              on
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground'
            )}
          >
            {on && <Check className='size-3 text-primary' />}
            <PlatformIcon platform={id} size='sm' />
          </button>
        )
      })}
    </div>
  )
}
