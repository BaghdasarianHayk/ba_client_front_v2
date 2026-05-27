import { Outlet } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useProjectStore } from '@/stores/project-store'

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

      <Main>
        <div className='mx-auto w-full max-w-2xl'>
          <Outlet />
        </div>
      </Main>
    </>
  )
}
