import { createFileRoute } from '@tanstack/react-router'
import { TrackedPostAutoReply } from '@/features/tracked-posts/settings/auto-reply'

export const Route = createFileRoute(
  '/_authenticated/tracked-posts/$postId/settings/auto-reply'
)({
  component: TrackedPostAutoReply,
})
