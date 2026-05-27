import {
  AtSign,
  BarChart3,
  BookOpen,
  BotMessageSquare,
  Building2,
  Eye,
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
          description: 'Social media posts matching your keywords',
        },
        {
          title: 'Reports',
          url: '/reports',
          icon: BarChart3,
          description: 'Analytics and trends over time',
        },
        {
          title: 'Task History',
          url: '/tasks',
          icon: BotMessageSquare,
          description: 'Log of all posted comments and reactions',
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
          description: 'Overview of all automation rules',
        },
        {
          title: 'Tracked Channels',
          url: '/followings',
          icon: Radio,
          description: 'Telegram channels you monitor',
        },
        {
          title: 'Tracked Posts',
          url: '/tracked-posts',
          icon: Rss,
          description: 'Individual posts monitored for comments',
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
          description: 'Documents AI uses for generating replies',
        },
        {
          title: 'Settings',
          icon: Settings,
          description: 'Project configuration and preferences',
          items: [
            {
              title: 'Project',
              url: '/settings',
              icon: Building2,
            },
            {
              title: 'Keywords',
              url: '/keywords',
              icon: KeyRound,
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
      ],
    },
  ],
}
