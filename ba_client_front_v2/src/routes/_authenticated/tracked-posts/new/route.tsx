import { createFileRoute } from '@tanstack/react-router'
import { TrackedPostSettings } from '@/features/tracked-posts/settings'

export const Route = createFileRoute('/_authenticated/tracked-posts/new')({
  component: TrackedPostSettings,
})
