import { createFileRoute } from '@tanstack/react-router'
import { SettingsComments } from '@/features/settings/comments'

export const Route = createFileRoute('/_authenticated/settings/comments')({
  component: SettingsComments,
})
