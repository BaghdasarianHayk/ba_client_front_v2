import { useEffect, useState } from 'react'
import { Outlet, useParams } from '@tanstack/react-router'
import { ArrowLeft, Building2, Eye, KeyRound, MessageSquare, SmilePlus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { SidebarNav } from '@/features/settings/components/sidebar-nav'
import { KeywordService, type Keyword } from '@/services/api/keyword-service'

export function KeywordSettings() {
  const { keywordId } = useParams({ strict: false }) as { keywordId?: string }
  const isNew = !keywordId || keywordId === 'new'

  const [keyword, setKeyword] = useState<Keyword | null>(null)
  const [loading, setLoading] = useState(!isNew)

  // Fetch keyword data for edit mode
  useEffect(() => {
    if (isNew) return
    setLoading(true)
    // We don't have a getKeyword endpoint in our service yet,
    // so we'll pass the keyword via navigation state or refetch from list
    // For now, the child forms will handle loading
    setLoading(false)
  }, [isNew, keywordId])

  const basePath = isNew ? '/keywords/new' : `/keywords/${keywordId}`

  const sidebarNavItems = [
    {
      title: 'General',
      href: basePath,
      icon: <Building2 size={18} />,
    },
    {
      title: 'Monitoring',
      href: `${basePath}/monitoring`,
      icon: <Eye size={18} />,
    },
    {
      title: 'Auto Comment',
      href: `${basePath}/auto-comment`,
      icon: <MessageSquare size={18} />,
    },
    {
      title: 'Auto React',
      href: `${basePath}/auto-react`,
      icon: <SmilePlus size={18} />,
    },
  ]

  return (
    <>
      <Header>
        <Button
          variant='ghost'
          size='icon'
          className='size-8'
          onClick={() => window.history.back()}
        >
          <ArrowLeft className='size-4' />
        </Button>
        <Separator orientation='vertical' className='h-5' />
        <h1 className='flex items-center gap-1.5 text-sm font-semibold'>
          <KeyRound className='size-4 text-muted-foreground' />
          {isNew ? 'New Keyword' : loading ? <Skeleton className='inline-block h-4 w-24' /> : 'Keyword Settings'}
        </h1>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className='flex w-full overflow-y-hidden p-1'>
            <Outlet />
          </div>
        </div>
      </Main>
    </>
  )
}
