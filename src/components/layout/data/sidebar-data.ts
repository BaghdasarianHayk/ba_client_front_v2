import {
  AtSign,
  BarChart3,
  BookOpen,
  BotMessageSquare,
  Building2,
  Eye,
  FolderOpen,
  HelpCircle,
  KeyRound,
  Palette,
  Radio,
  Rss,
  Settings,
  Users,
  Zap,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '',
  },
  teams: [],
  navGroups: [
    {
      title: 'Monitoring',
      items: [
        {
          title: 'Mentions',
          url: '/sheet',
          icon: AtSign,
        },
        {
          title: 'Reports',
          url: '/reports',
          icon: BarChart3,
        },
        {
          title: 'Task History',
          url: '/tasks',
          icon: BotMessageSquare,
        },
      ],
    },
    {
      title: 'Auto Actions',
      items: [
        {
          title: 'All Auto Actions',
          url: '/auto-actions',
          icon: Zap,
        },
        {
          title: 'Keywords',
          url: '/keywords',
          icon: KeyRound,
        },
        {
          title: 'Followings',
          url: '/followings',
          icon: Radio,
        },
        {
          title: 'Tracked Posts',
          url: '/tracked-posts',
          icon: Rss,
        },
      ],
    },
    {
      title: 'Project',
      items: [
        {
          title: 'Knowledge Base',
          url: '/knowledge-base',
          icon: BookOpen,
        },
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Project',
              url: '/settings',
              icon: Building2,
            },
            {
              title: 'Comments Preview',
              url: '/settings/comments',
              icon: Eye,
            },
            {
              title: 'Access & Export',
              url: '/settings/access',
              icon: Users,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
          ],
        },
        {
          title: 'All Projects',
          url: '/',
          icon: FolderOpen,
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
