import { Outlet, useParams, useLocation } from '@tanstack/react-router'
import { ArrowLeft, Eye, MessageSquare, SmilePlus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { SidebarNav } from '@/features/settings/components/sidebar-nav'
import { FollowingGeneral } from './general'
import { FollowingMonitoring } from './monitoring'

export function FollowingSettings() {
  const { channelId } = useParams({ strict: false }) as { channelId?: string }
  const { pathname } = useLocation()
  const isNew = !channelId || channelId === 'new'
  const basePath = isNew ? '/followings/new' : `/followings/${channelId}/settings`

  // Check if we're on the General/base tab (no sub-route)
  const isGeneralTab =
    pathname === basePath ||
    pathname === `${basePath}/`

  const sidebarNavItems = [
    { title: 'Monitoring', href: `${basePath}/monitoring`, icon: <Eye size={18} /> },
    { title: 'Auto Comment', href: `${basePath}/auto-comment`, icon: <MessageSquare size={18} /> },
    { title: 'React to Posts', href: `${basePath}/react-posts`, icon: <SmilePlus size={18} /> },
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
        <h1 className='text-sm font-semibold'>
          {isNew ? 'New Following' : 'Following Settings'}
        </h1>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='flex flex-1 flex-col'>
          {/* General is always visible at the top */}
          <div className='mb-6'>
            <FollowingGeneral />
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
                  {isGeneralTab ? <FollowingMonitoring /> : <Outlet />}
                </div>
              </div>
            </>
          )}
        </div>
      </Main>
    </>
  )
}
