import { useEffect, useState } from 'react'
import { Outlet, useParams, useLocation } from '@tanstack/react-router'
import { ArrowLeft, Eye, KeyRound, MessageSquare, SmilePlus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { HeaderSaveButton } from '@/components/header-save-button'
import { SidebarNav } from '@/features/settings/components/sidebar-nav'
import { KeywordGeneral } from './general'
import { KeywordMonitoring } from './monitoring'

export function KeywordSettings() {
  const { keywordId } = useParams({ strict: false }) as { keywordId?: string }
  const { pathname } = useLocation()
  const isNew = !keywordId || keywordId === 'new'

  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    setLoading(false)
  }, [isNew, keywordId])

  const basePath = isNew ? '/keywords/new' : `/keywords/${keywordId}`

  // Check if we're on the General/base tab (no sub-route)
  const isGeneralTab =
    pathname === basePath ||
    pathname === `${basePath}/`

  const sidebarNavItems = [
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
          <HeaderSaveButton />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='flex flex-1 flex-col'>
          {/* General is always visible at the top */}
          <div className='mb-6'>
            <KeywordGeneral />
          </div>

          {/* Other tabs below */}
          {!isNew && (
            <>
              <Separator className='mb-4' />
              <div className='flex flex-1 flex-col space-y-2 md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
                <aside className='top-0 lg:sticky lg:w-1/5'>
                  <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className='flex w-full p-1'>
                  {isGeneralTab ? <KeywordMonitoring /> : <Outlet />}
                </div>
              </div>
            </>
          )}
        </div>
      </Main>
    </>
  )
}
