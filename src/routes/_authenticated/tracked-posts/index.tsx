import { createFileRoute } from '@tanstack/react-router'
import { TrackedPostsPage } from '@/features/tracked-posts'

export const Route = createFileRoute('/_authenticated/tracked-posts/')({
  component: TrackedPostsPage,
})
