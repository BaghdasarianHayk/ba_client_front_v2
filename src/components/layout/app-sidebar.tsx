import { Link } from '@tanstack/react-router'
import { HelpCircle } from 'lucide-react'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip='Help Center'>
              <Link to='/help-center'>
                <HelpCircle />
                <span>Help Center</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
