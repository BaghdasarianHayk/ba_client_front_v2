import { useMemo } from 'react'
import { Button } from '@/components/ui/button'

type Preset = '24h' | '1w' | '1m'

function getRange(preset: Preset) {
  const to = new Date()
  const from = new Date()
  if (preset === '24h') from.setDate(from.getDate() - 1)
  else if (preset === '1w') from.setDate(from.getDate() - 7)
  else from.setMonth(from.getMonth() - 1)
  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)
  return { from, to }
}

function sameDay(a: Date | undefined, b: Date) {
  return (
    a !== undefined &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: '24h', label: '24 hours' },
  { key: '1w', label: '1 week' },
  { key: '1m', label: '1 month' },
]

export function DateRangePresets({
  from,
  onSelect,
}: {
  from?: Date
  onSelect: (from: Date, to: Date) => void
}) {
  const active = useMemo(
    () => PRESETS.find((p) => sameDay(from, getRange(p.key).from))?.key ?? null,
    [from]
  )

  return (
    <div className='flex gap-1 border-b p-2'>
      {PRESETS.map((p) => (
        <Button
          key={p.key}
          variant={active === p.key ? 'default' : 'outline'}
          size='sm'
          className='h-7 text-xs'
          onClick={() => {
            const r = getRange(p.key)
            onSelect(r.from, r.to)
          }}
        >
          {p.label}
        </Button>
      ))}
    </div>
  )
}
