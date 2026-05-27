import { useCallback, useState, type KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

type RangeSliderWithInputProps = {
  value: [number, number]
  onValueChange: (value: [number, number]) => void
  min: number
  max: number
  step?: number
  className?: string
}

export function RangeSliderWithInput({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  className,
}: RangeSliderWithInputProps) {
  const [localMin, setLocalMin] = useState(String(value[0]))
  const [localMax, setLocalMax] = useState(String(value[1]))

  // Sync local state when value changes externally (e.g. from slider)
  const handleSliderChange = useCallback(
    (v: number[]) => {
      const next: [number, number] = [v[0], v[1]]
      onValueChange(next)
      setLocalMin(String(next[0]))
      setLocalMax(String(next[1]))
    },
    [onValueChange]
  )

  const commitMin = () => {
    let n = parseInt(localMin, 10)
    if (isNaN(n)) n = min
    n = Math.max(min, Math.min(n, value[1]))
    setLocalMin(String(n))
    onValueChange([n, value[1]])
  }

  const commitMax = () => {
    let n = parseInt(localMax, 10)
    if (isNaN(n)) n = max
    n = Math.min(max, Math.max(n, value[0]))
    setLocalMax(String(n))
    onValueChange([value[0], n])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, commit: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div className={className}>
      <div className='flex items-center gap-2'>
        <Input
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          onBlur={commitMin}
          onKeyDown={(e) => handleKeyDown(e, commitMin)}
          inputMode='numeric'
          className='h-7 w-14 px-1.5 text-center text-xs'
        />
        <Slider
          value={value}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className='flex-1'
        />
        <Input
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onBlur={commitMax}
          onKeyDown={(e) => handleKeyDown(e, commitMax)}
          inputMode='numeric'
          className='h-7 w-14 px-1.5 text-center text-xs'
        />
      </div>
    </div>
  )
}
