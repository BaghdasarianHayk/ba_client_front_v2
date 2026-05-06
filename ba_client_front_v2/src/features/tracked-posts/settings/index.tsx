import { Outlet, useParams } from '@tanstack/react-router'
import { ArrowLeft, Building2, MessageSquare, SmilePlus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { SidebarNav } from '@/features/settings/components/sidebar-nav'

export function TrackedPostSettings() {
  const { postId } = useParams({ strict: false }) as { postId?: string }
  const isNew = !postId || postId === 'new'
  const basePath = isNew
    ? '/tracked-posts/new'
    : `/tracked-posts/${postId}/settings`

  const sidebarNavItems = [
    { title: 'General', href: basePath, icon: <Building2 size={18} /> },
    {
      title: 'Auto Reply',
      href: `${basePath}/auto-reply`,
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
        <h1 className='text-sm font-semibold'>
          {isNew ? 'Track New Post' : 'Post Settings'}
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
