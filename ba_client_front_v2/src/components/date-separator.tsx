import { Separator } from '@/components/ui/separator'

export function DateSeparator({ date }: { date: string }) {
  return (
    <div className='flex items-center gap-3 py-3'>
      <Separator className='flex-1' />
      <span className='shrink-0 text-xs text-muted-foreground'>{date}</span>
      <Separator className='flex-1' />
    </div>
  )
}
