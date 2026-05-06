import { createFileRoute } from '@tanstack/react-router'
import { TrackedPostAutoReact } from '@/features/tracked-posts/settings/auto-react'

export const Route = createFileRoute(
  '/_authenticated/tracked-posts/new/auto-react'
)({
  component: TrackedPostAutoReact,
})
