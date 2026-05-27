import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type ScrollSpyItem = {
  id: string
  title: string
  icon: JSX.Element
}

type ScrollSpyNavProps = {
  items: ScrollSpyItem[]
  /** The scrollable container ref. If not provided, uses the nearest scrollable parent. */
  containerRef?: React.RefObject<HTMLElement | null>
  className?: string
}

export function ScrollSpyNav({ items, containerRef, className }: ScrollSpyNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isScrollingRef = useRef(false)

  // Set up IntersectionObserver for scroll-spy
  useEffect(() => {
    const root = containerRef?.current ?? null

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return
        // Find the first visible section
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      {
        root,
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0,
      }
    )

    const sections = items.map((item) => document.getElementById(item.id)).filter(Boolean)
    sections.forEach((el) => observerRef.current?.observe(el!))

    return () => observerRef.current?.disconnect()
  }, [items, containerRef])

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    isScrollingRef.current = true
    setActiveId(id)
    // Offset for fixed header (h-16 = 64px + some padding)
    const headerOffset = 80
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({ top, behavior: 'smooth' })
    // Re-enable observer after scroll completes
    setTimeout(() => { isScrollingRef.current = false }, 800)
  }, [])

  return (
    <>
      {/* Mobile: select dropdown */}
      <div className='p-1 lg:hidden'>
        <Select value={activeId} onValueChange={handleClick}>
          <SelectTrigger className='h-10'>
            <SelectValue placeholder='Select section' />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <div className='flex items-center gap-2'>
                  <span className='scale-110'>{item.icon}</span>
                  <span>{item.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: sticky side nav */}
      <nav className={cn('hidden lg:block', className)}>
        <div className='space-y-1'>
          {items.map((item) => (
            <button
              key={item.id}
              type='button'
              onClick={() => handleClick(item.id)}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full justify-start',
                activeId === item.id
                  ? 'bg-muted font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className='me-2'>{item.icon}</span>
              {item.title}
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
