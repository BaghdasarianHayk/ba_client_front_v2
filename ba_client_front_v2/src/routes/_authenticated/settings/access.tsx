import { createFileRoute } from '@tanstack/react-router'
import { SettingsAccess } from '@/features/settings/access'

export const Route = createFileRoute('/_authenticated/settings/access')({
  component: SettingsAccess,
})
