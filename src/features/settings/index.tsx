import { Outlet } from '@tanstack/react-router'
import { Building2, Eye, Palette, Users } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useProjectStore } from '@/stores/project-store'
import { SidebarNav } from './components/sidebar-nav'

const sidebarNavItems = [
  {
    title: 'Project',
    href: '/settings',
    icon: <Building2 size={18} />,
  },
  {
    title: 'Comments Preview',
    href: '/settings/comments',
    icon: <Eye size={18} />,
  },
  {
    title: 'Access & Export',
    href: '/settings/access',
    icon: <Users size={18} />,
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: <Palette size={18} />,
  },
]

export function Settings() {
  const { currentProject } = useProjectStore()

  return (
    <>
      <Header>
        <h1 className='text-sm font-semibold'>Project Settings</h1>
        {currentProject && (
          <span className='text-sm text-muted-foreground'>
            {currentProject.brand_name}
          </span>
        )}
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Settings
          </h1>
          <p className='text-muted-foreground'>
            Manage your project configuration, access, and preferences.
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
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
