import { Link } from '@tanstack/react-router'
import { HelpCircle } from 'lucide-react'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { TeamSwitcher } from './team-switcher'
import { useTaskStore } from '@/stores/task-store'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const processingCount = useTaskStore((s) => s.processingCount)

  // Inject live processing count badge into Task History item
  const navGroups = sidebarData.navGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.url === '/tasks' && processingCount > 0) {
        return { ...item, badge: String(processingCount) }
      }
      return item
    }),
  }))

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <Link
          to='/help-center'
          className='flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        >
          <HelpCircle className='size-4' />
          <span>Help Center</span>
        </Link>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
