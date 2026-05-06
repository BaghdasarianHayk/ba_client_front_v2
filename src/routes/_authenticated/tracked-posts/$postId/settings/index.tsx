import { createFileRoute } from '@tanstack/react-router'
import { TrackedPostGeneral } from '@/features/tracked-posts/settings/general'

export const Route = createFileRoute(
  '/_authenticated/tracked-posts/$postId/settings/'
)({
  component: TrackedPostGeneral,
})
