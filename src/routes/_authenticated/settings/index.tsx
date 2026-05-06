import { createFileRoute } from '@tanstack/react-router'
import { SettingsProject } from '@/features/settings/project'

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsProject,
})
